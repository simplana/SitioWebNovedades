// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/* =========================
   CORS
========================= */
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

/* =========================
   Types
========================= */
interface PagueloFacilPayment {
  id: string;
  amount: number;
  currency?: string;
  description: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  redirectUrls: {
    success: string;
    cancel?: string;
    notify?: string;
  };
}

interface PagueloFacilResponse {
  success: boolean;
  paymentId: string;
  paymentUrl: string;
  paymentCode?: string;
  message?: string;
  error?: string;
}

/* =========================
   Utils
========================= */
function stringToHex(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/* =========================
   Handler
========================= */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    /* =========================
       Body validation
    ========================= */
    const paymentData: PagueloFacilPayment = await req.json();

    if (!paymentData.id || !paymentData.amount || !paymentData.customer) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: id, amount, customer",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    /* =========================
       Env vars
    ========================= */
    const pagueloFacilCCLW = Deno.env.get("PAGUELO_FACIL_CCLW");
    const environment =
      Deno.env.get("PAGUELO_FACIL_ENVIRONMENT") ?? "sandbox";

    const pagueloFacilApiUrl =
      environment === "production"
        ? "https://secure.paguelofacil.com"
        : "https://sandbox.paguelofacil.com";

    if (!pagueloFacilCCLW) {
      return new Response(
        JSON.stringify({
          error: "PAGUELO_FACIL_CCLW is not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    /* =========================
       Build request
    ========================= */
    const returnUrlHex = stringToHex(paymentData.redirectUrls.success);

    const formData = new URLSearchParams();
    formData.append("CCLW", pagueloFacilCCLW);
    formData.append("CMTN", paymentData.amount.toFixed(2));
    formData.append("CDSC", paymentData.description);
    formData.append("RETURN_URL", returnUrlHex);
    formData.append("PARM_1", paymentData.id);
    formData.append("EXPIRES_IN", "3600");

    /* =========================
       Call Paguelo Fácil
    ========================= */
    const pfResponse = await fetch(
      `${pagueloFacilApiUrl}/LinkDeamon.cfm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      },
    );

    const rawText = await pfResponse.text();

    if (!pfResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          paymentId: "",
          paymentUrl: "",
          error: rawText,
        }),
        {
          status: pfResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    /* =========================
       Parse response
       (Paguelo Fácil often returns JSON)
    ========================= */
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          paymentId: "",
          paymentUrl: "",
          error: "Invalid response from payment gateway",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!parsed?.data?.url || !parsed?.data?.code) {
      return new Response(
        JSON.stringify({
          success: false,
          paymentId: "",
          paymentUrl: "",
          error: "Unexpected Paguelo Fácil response",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const paymentUrl = parsed.data.url;
    const paymentCode = parsed.data.code;

    /* =========================
       Audit log (optional)
    ========================= */
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);

      await supabase.from("audit_logs").insert({
        event_type: "payment_link_created",
        metadata: {
          payment_code: paymentCode,
          order_reference: paymentData.id,
          amount: paymentData.amount,
          currency: paymentData.currency ?? "USD",
          environment,
        },
        severity: "medium",
      });
    }

    /* =========================
       Final response
    ========================= */
    const response: PagueloFacilResponse = {
      success: true,
      paymentId: paymentCode,
      paymentCode,
      paymentUrl,
      message: "Payment link created successfully",
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Edge function error:", err);

    return new Response(
      JSON.stringify({
        success: false,
        paymentId: "",
        paymentUrl: "",
        error:
          err instanceof Error ? err.message : "Unexpected server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
