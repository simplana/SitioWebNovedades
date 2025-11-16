import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PagueloFacilStatus {
  paymentId: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  amount: number;
  currency: string;
  transactionId?: string;
  paidAt?: string;
}

function mapPaymentStatus(status: string): PagueloFacilStatus["status"] {
  switch (status?.toLowerCase()) {
    case "completed":
    case "paid":
    case "success":
      return "completed";
    case "pending":
    case "processing":
      return "pending";
    case "failed":
    case "error":
      return "failed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let paymentId: string;

    if (req.method === "POST") {
      const body = await req.json();
      paymentId = body.paymentId;
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      paymentId = url.searchParams.get("paymentId") || "";
    } else {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Missing paymentId parameter" }),
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

    console.log(`Checking payment status for: ${paymentId}`);

    const pagueloFacilResponse = await fetch(
      `${pagueloFacilApiUrl}/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${pagueloFacilToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

    console.log(`Paguelo Fácil response status: ${pagueloFacilResponse.status}`);

    if (!pagueloFacilResponse.ok) {
      const errorText = await pagueloFacilResponse.text();
      console.error("Paguelo Fácil error:", errorText);

      return new Response(
        JSON.stringify({ error: `Payment service error: ${pagueloFacilResponse.status}` }),
        {
          status: pagueloFacilResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responseData = await pagueloFacilResponse.json();

    const status: PagueloFacilStatus = {
      paymentId: responseData.id,
      status: mapPaymentStatus(responseData.status),
      amount: responseData.amount,
      currency: responseData.currency,
      transactionId: responseData.transaction_id,
      paidAt: responseData.paid_at,
    };

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
