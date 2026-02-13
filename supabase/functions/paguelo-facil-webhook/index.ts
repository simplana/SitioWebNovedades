import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Helper function to parse date from dd/mm/yyyy format
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  // parts[0] = day, parts[1] = month, parts[2] = year
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Paguelo Facil sends webhook data as URL parameters (GET or POST)
    let payload: any = {};

    if (req.method === "POST") {
      // Try to parse as JSON first, then as form data
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        payload = await req.json();
      } else {
        // Parse as URL-encoded form data
        const formData = await req.formData();
        payload = Object.fromEntries(formData.entries());
      }
    } else if (req.method === "GET") {
      // Parse query parameters
      const url = new URL(req.url);
      payload = Object.fromEntries(url.searchParams.entries());
    } else {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Received Paguelo Fácil webhook");

    // Extract parameters according to Paguelo Facil documentation
    const totalPagado = payload.TotalPagado || payload.TotalPay || "0";
    const fecha = payload.Fecha || payload.Date || "";
    const hora = payload.Hora || "";
    const tipo = payload.Tipo || payload.Type || "";
    const oper = payload.Oper || ""; // Operation number (payment ID)
    const usuario = payload.Usuario || payload.User || "";
    const email = payload.Email || payload.email || "";
    const estado = payload.Estado || payload.Status || "";
    const razon = payload.Razon || payload.msg || "";
    const orderId = payload.PARM_1 || payload.CDSC || ""; // Custom parameter with order ID

    console.log(`Webhook details - Oper: ${oper}, Estado: ${estado}, Order: ${orderId}`);

    if (!oper) {
      console.error("Webhook payload missing Oper (operation number)");
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload: missing operation number" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine payment status
    const isApproved = estado === "Aprobada" || estado === "Approved";
    const isDenied = estado === "Denegada" || estado === "Denegado" || estado === "Denied";
    const paymentAmount = parseFloat(totalPagado) || 0;
    const paymentStatus = isApproved && paymentAmount > 0 ? "completed" : isDenied ? "failed" : "pending";

    // Find the order by PARM_1 or by searching recent orders
    let orderToUpdate = null;

    if (orderId) {
      // Try to find by order ID from PARM_1
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      orderToUpdate = orders;
    }

    // If not found and we have a payment code in the oper, try to find by payment_code
    if (!orderToUpdate && oper.startsWith("LK-")) {
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_code", oper)
        .maybeSingle();

      orderToUpdate = orders;
    }

    if (orderToUpdate) {
      console.log(`Found order: ${orderToUpdate.id}`);

      // Update order with payment information
      const updateData: any = {
        payment_id: oper,
        payment_status: paymentStatus,
        payment_metadata: {
          total_paid: paymentAmount,
          date: fecha,
          time: hora,
          type: tipo,
          user: usuario,
          email: email,
          status: estado,
          reason: razon,
          raw_payload: payload,
        },
        updated_at: new Date().toISOString(),
      };

      // If payment is completed, update status and completion time
      if (paymentStatus === "completed") {
        updateData.status = "processing"; // Move order to processing
        updateData.payment_completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderToUpdate.id);

      if (updateError) {
        console.error("Error updating order:", updateError);
      } else {
        console.log(`Order ${orderToUpdate.id} updated successfully`);
      }

      // Create transaction record
      try {
        const transactionDate = parseDate(fecha);

        await supabase.from("payment_transactions").insert({
          order_id: orderToUpdate.id,
          payment_code: oper.startsWith("LK-") ? oper : orderToUpdate.payment_code,
          payment_id: oper,
          status: paymentStatus,
          amount: paymentAmount,
          payment_type: tipo,
          customer_email: email || orderToUpdate.customer_email,
          customer_name: usuario || orderToUpdate.customer_name,
          transaction_date: transactionDate,
          transaction_time: hora || null,
          approval_reason: razon,
          raw_response: payload,
        });

        console.log("Payment transaction record created");
      } catch (txError) {
        console.error("Error creating transaction record:", txError);
      }
    } else {
      console.warn(`Order not found for Oper: ${oper}, PARM_1: ${orderId}`);
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: paymentStatus === "completed" ? "payment_completed" : "payment_webhook_received",
      user_id: null,
      metadata: {
        payment_id: oper,
        order_id: orderId,
        status: estado,
        payment_status: paymentStatus,
        amount: paymentAmount,
        payment_type: tipo,
        timestamp: new Date().toISOString(),
      },
      severity: paymentStatus === "failed" ? "high" : "medium",
    });

    console.log(`Webhook processed successfully for payment: ${oper}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
