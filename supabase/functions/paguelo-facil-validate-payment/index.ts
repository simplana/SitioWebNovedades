import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const PAGUELO_FACIL_API_KEY = Deno.env.get("PAGUELO_FACIL_API_KEY");
const ENV = Deno.env.get("PAGUELO_FACIL_ENVIRONMENT") ?? "sandbox";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!PAGUELO_FACIL_API_KEY) {
  throw new Error("Missing PAGUELO_FACIL_API_KEY");
}

const PAGUELO_FACIL_MANAGEMENT_API_URL =
  ENV === "production"
    ? "https://admin.paguelofacil.com/PFManagementServices/api/v1/MerchantTransactions"
    : "https://sandbox.paguelofacil.com/PFManagementServices/api/v1/MerchantTransactions";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TransactionResponse {
  codOper: string;
  Estado: string;
  TotalPagado: string | number;
  Fecha: string;
  Hora: string;
  Tipo: string;
  Usuario: string;
  Email: string;
  Razon?: string;
}

Deno.serve(async (req: Request) => {
  console.log("🔍 Payment validation request:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const { paymentCode, orderId } = body;

    if (!paymentCode || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing paymentCode or orderId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔎 Validating payment:", { paymentCode, orderId, environment: ENV });

    const filter = `codOper::AUTH_CAP-${paymentCode}`;
    const apiUrl = `${PAGUELO_FACIL_MANAGEMENT_API_URL}?filter=${encodeURIComponent(filter)}`;

    console.log("📡 Calling Páguelo Fácil API:", apiUrl);

    const pfResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${PAGUELO_FACIL_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!pfResponse.ok) {
      const errorText = await pfResponse.text();
      console.error("❌ Páguelo Fácil API error:", {
        status: pfResponse.status,
        body: errorText,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to validate payment with Páguelo Fácil",
          details: errorText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const transactions: TransactionResponse[] = await pfResponse.json();

    console.log("📦 Transaction response:", transactions);

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Transaction not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const transaction = transactions[0];
    const estado = transaction.Estado;
    const isApproved = estado === "Aprobada" || estado === "Approved";
    const isDenied = estado === "Denegada" || estado === "Denied";

    console.log("💳 Transaction status:", {
      estado,
      isApproved,
      isDenied,
      environment: ENV,
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let finalStatus: "approved" | "denied";
    let shouldDeleteOrder = false;

    if (isApproved) {
      finalStatus = "approved";
    } else if (isDenied) {
      if (ENV === "sandbox") {
        console.log("⚠️ SANDBOX MODE: Accepting denied transaction for testing");
        finalStatus = "approved";
      } else {
        console.log("❌ PRODUCTION: Rejecting denied transaction");
        finalStatus = "denied";
        shouldDeleteOrder = true;
      }
    } else {
      finalStatus = "denied";
      if (ENV === "production") {
        shouldDeleteOrder = true;
      }
    }

    if (shouldDeleteOrder) {
      console.log("🗑️ Deleting order due to denied payment in production:", orderId);

      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (deleteError) {
        console.error("❌ Error deleting order:", deleteError);
      } else {
        console.log("✅ Order deleted successfully");
      }

      return new Response(
        JSON.stringify({
          success: false,
          paymentStatus: finalStatus,
          orderDeleted: true,
          message: "Payment denied and order removed",
          transaction: {
            estado: transaction.Estado,
            razon: transaction.Razon,
            fecha: transaction.Fecha,
            hora: transaction.Hora,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: finalStatus,
        status: finalStatus === "approved" ? "processing" : "cancelled",
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("❌ Error updating order:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update order status",
          details: updateError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Order updated successfully:", {
      orderId,
      paymentStatus: finalStatus,
      orderStatus: finalStatus === "approved" ? "processing" : "cancelled",
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: finalStatus,
        orderDeleted: false,
        transaction: {
          estado: transaction.Estado,
          totalPagado: transaction.TotalPagado,
          fecha: transaction.Fecha,
          hora: transaction.Hora,
          tipo: transaction.Tipo,
          usuario: transaction.Usuario,
          email: transaction.Email,
          razon: transaction.Razon,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
