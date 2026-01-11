import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigin =
  Deno.env.get("ALLOWED_ORIGIN") ??
  "https://precious-queijadas-227d35.netlify.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  console.log("🔥 HIT", req.method);

  // 1️⃣ CORS preflight — MUST return before anything else
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // 2️⃣ Explicitly allow ONLY POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 3️⃣ Safe JSON parsing
  let payload;
  try {
    payload = await req.json();
  } catch (_e) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  console.log("✅ PAYLOAD RECEIVED", payload);

  // 4️⃣ TEMP RESPONSE (to prove POST works)
  return new Response(
    JSON.stringify({
      ok: true,
      received: payload,
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
