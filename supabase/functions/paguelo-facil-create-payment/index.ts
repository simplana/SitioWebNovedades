// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
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

function stringToHex(str: string): string {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

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
    const paymentData: PagueloFacilPayment = await req.json();

    console.log("Received payment data:", JSON.stringify(paymentData, null, 2));

    if (!paymentData.id || !paymentData.amount || !paymentData.customer) {
      console.error("Validation failed:", {
        hasId: !!paymentData.id,
        hasAmount: !!paymentData.amount,
        hasCustomer: !!paymentData.customer,
      });
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: credentials, error: credError } = await supabase
      .from("paguelo_facil_credentials")
      .select("*")
      .eq("environment", "sandbox")
      .maybeSingle();

    if (credError || !credentials) {
      console.error("Failed to fetch credentials:", credError);
      return new Response(
        JSON.stringify({
          error: "Payment gateway credentials not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { store_id, token } = credentials;

    if (!store_id || !token) {
      console.error("Incomplete credentials:", { hasStore: !!store_id, hasToken: !!token });
      return new Response(
        JSON.stringify({
          error: "Payment gateway credentials incomplete",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const amountFormatted = (paymentData.amount * 100).toFixed(0);
    const nameHex = stringToHex(paymentData.customer.name);
    const emailHex = stringToHex(paymentData.customer.email);
    const amountHex = stringToHex(amountFormatted);
    const descriptionHex = stringToHex(paymentData.description);

    const concatenated = `${store_id}${nameHex}${emailHex}${amountHex}${descriptionHex}${token}`.toUpperCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(concatenated);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const authHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    console.log("Payment request details:", {
      store_id,
      amount: amountFormatted,
      nameHex,
      emailHex,
      authHash: authHash.substring(0, 20) + "...",
    });

    const pagueloPayload = {
      nombre: paymentData.customer.name,
      apellido: "",
      email: paymentData.customer.email,
      monto: amountFormatted,
      direccion: "",
      telefono: paymentData.customer.phone || "",
      concepto: paymentData.description,
      estado: "PE",
      pais: "PA",
      success_url: paymentData.redirectUrls.success,
      cancel_url: paymentData.redirectUrls.cancel || paymentData.redirectUrls.success,
      error_url: paymentData.redirectUrls.cancel || paymentData.redirectUrls.success,
      autorizacion: authHash,
      id_store: store_id,
    };

    console.log("Sending to Paguelo Fácil:", {
      ...pagueloPayload,
      autorizacion: pagueloPayload.autorizacion.substring(0, 20) + "...",
    });

    const pagueloResponse = await fetch(
      "https://sandbox.paguelofacil.com/Paycomet/rest/procesar_pago",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(pagueloPayload as any).toString(),
      },
    );

    const responseText = await pagueloResponse.text();
    console.log("Paguelo Fácil raw response:", responseText);

    let pagueloResult;
    try {
      pagueloResult = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Paguelo Fácil response:", e);
      return new Response(
        JSON.stringify({
          error: "Invalid response from payment gateway",
          details: responseText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Paguelo Fácil parsed response:", pagueloResult);

    if (!pagueloResponse.ok || !pagueloResult.url) {
      console.error("Paguelo Fácil API error:", {
        status: pagueloResponse.status,
        result: pagueloResult,
      });
      return new Response(
        JSON.stringify({
          success: false,
          paymentId: "",
          paymentUrl: "",
          error: pagueloResult.message || "Payment gateway error",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const response: PagueloFacilResponse = {
      success: true,
      paymentId: pagueloResult.clave || paymentData.id,
      paymentUrl: pagueloResult.url,
      paymentCode: pagueloResult.clave,
      message: "Payment created successfully",
    };

    console.log("Success! Returning response:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        paymentId: "",
        paymentUrl: "",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
