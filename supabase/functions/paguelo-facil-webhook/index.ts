import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.55.0";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = await req.json();

    console.log("Received Paguelo Fácil webhook (payload sanitized)");

    const paymentId = payload.payment_id || payload.id || payload.paymentId;
    const status = payload.status;
    const reference = payload.reference || payload.order_reference;

    if (!paymentId) {
      console.error("Webhook payload missing payment_id");
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload: missing payment_id" }),
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

    const sanitizedMetadata = {
      payment_id: paymentId,
      status: status,
      order_reference: reference,
      amount: payload.amount,
      currency: payload.currency,
      timestamp: new Date().toISOString(),
      webhook_received_at: new Date().toISOString(),
    };

    await supabase.from("audit_logs").insert({
      event_type: status === "completed" || status === "paid" ? "payment_completed" : "payment_updated",
      user_id: null,
      metadata: sanitizedMetadata,
      severity: status === "failed" ? "high" : "medium",
    });

    console.log(`Webhook processed successfully for payment: ${paymentId}`);

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
