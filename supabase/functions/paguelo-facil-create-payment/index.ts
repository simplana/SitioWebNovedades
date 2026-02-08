import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGIN =
  Deno.env.get("ALLOWED_ORIGIN") ??
  "https://precious-queijadas-227d35.netlify.app";

const PAGUELO_FACIL_CCLW = Deno.env.get("PAGUELO_FACIL_CCLW");
const ENV = Deno.env.get("PAGUELO_FACIL_ENVIRONMENT") ?? "sandbox";

if (!PAGUELO_FACIL_CCLW) {
  throw new Error("Missing Paguelofacil CCLW");
}

const PAGUELO_FACIL_API_URL =
  ENV === "production"
    ? "https://paguelofacil.com/LinkDeamon.cfm"
    : "https://sandbox.paguelofacil.com/LinkDeamon.cfm";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  console.log("🔥 HIT", req.method);

  /* ---------- CORS ---------- */
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

  /* ---------- Parse body ---------- */
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log("📦 REQUEST BODY:", body);

  if (!body.amount || !body.description) {
    return new Response(
      JSON.stringify({ error: "Missing amount or description" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  /* ---------- Build POST form ---------- */
  const formBody = new URLSearchParams({
    CCLW: PAGUELO_FACIL_CCLW,
    CMTN: String(body.amount),
    CTAX: String(body.tax ?? 0),
    CDSC: body.description,
    RETURN_URL:
      body.redirectUrls?.success ??
      "https://precious-queijadas-227d35.netlify.app",
    CARD_TYPE: body.card_type ?? "CARD",
    FORMAT: "JSON",
  });

  console.log(
    "➡️ POSTING TO PAGUELOFACIL:",
    PAGUELO_FACIL_API_URL,
    formBody.toString()
  );

  /* ---------- Call Paguelofacil ---------- */
  const pfResponse = await fetch(PAGUELO_FACIL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "Supabase-Edge-Function",
    },
    body: formBody.toString(),
  });

  const contentType = pfResponse.headers.get("content-type") || "";
  const rawBody = await pfResponse.text();

  console.log("⬅️ PAGUELOFACIL RAW RESPONSE:", rawBody);

  if (!contentType.includes("application/json")) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Paguelofacil returned non-JSON response",
        debug: {
          status: pfResponse.status,
          contentType,
          preview: rawBody.slice(0, 300),
        },
      }),
      {
        status: 502,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  const result = JSON.parse(rawBody);
  const checkoutUrl = result?.data?.url;
  const code = result?.data?.code;

  if (!checkoutUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing checkout URL in Paguelofacil response",
        debug: result,
      }),
      {
        status: 502,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  /* ---------- FINAL RESPONSE ---------- */
  return new Response(
    JSON.stringify({
      success: true,
      url: checkoutUrl,
      code: code
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});