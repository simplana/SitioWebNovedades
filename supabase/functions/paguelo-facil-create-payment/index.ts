import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.55.0";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PagueloFacilPayment {
  id: string;
  amount: number;
  currency: string;
  description: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  redirectUrls: {
    success: string;
    cancel: string;
    notify: string;
  };
}

interface PagueloFacilResponse {
  success: boolean;
  paymentId: string;
  paymentUrl: string;
  message?: string;
  error?: string;
}

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

    const paymentData: PagueloFacilPayment = await req.json();

    if (!paymentData.id || !paymentData.amount || !paymentData.customer) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: id, amount, customer" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pagueloFacilToken = Deno.env.get("PAGUELO_FACIL_ACCESS_TOKEN");
    const pagueloFacilApiUrl = Deno.env.get("PAGUELO_FACIL_API_URL") || "https://api.paguelofacil.com";

    if (!pagueloFacilToken) {
      console.error("PAGUELO_FACIL_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Creating payment with Paguelo Fácil for order: ${paymentData.id}`);

    const pagueloFacilPayload = {
      amount: paymentData.amount,
      currency: paymentData.currency || "USD",
      description: paymentData.description,
      reference: paymentData.id,
      customer: paymentData.customer,
      items: paymentData.items,
      redirect_urls: paymentData.redirectUrls,
      metadata: {
        source: "novedades-catolicas",
        timestamp: new Date().toISOString(),
      },
    };

    const pagueloFacilResponse = await fetch(`${pagueloFacilApiUrl}/v1/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pagueloFacilToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(pagueloFacilPayload),
    });

    console.log(`Paguelo Fácil response status: ${pagueloFacilResponse.status}`);

    if (!pagueloFacilResponse.ok) {
      const errorText = await pagueloFacilResponse.text();
      console.error("Paguelo Fácil error:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      const response: PagueloFacilResponse = {
        success: false,
        paymentId: "",
        paymentUrl: "",
        error: errorData.message || `Payment service error: ${pagueloFacilResponse.status}`,
      };

      return new Response(JSON.stringify(response), {
        status: pagueloFacilResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseData = await pagueloFacilResponse.json();
    console.log("Payment created successfully");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("audit_logs").insert({
          event_type: "payment_initiated",
          user_id: null,
          metadata: {
            payment_id: responseData.id || responseData.payment_id,
            order_reference: paymentData.id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            timestamp: new Date().toISOString(),
          },
          severity: "medium",
        });
      } catch (error) {
        console.error("Failed to log audit event:", error);
      }
    }

    const response: PagueloFacilResponse = {
      success: true,
      paymentId: responseData.id || responseData.payment_id,
      paymentUrl: responseData.payment_url || responseData.checkout_url,
      message: "Payment created successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        paymentId: "",
        paymentUrl: "",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
