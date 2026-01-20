import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface CotizacionRequest {
  ciu_ori: string;
  provincia_ori: string;
  ciu_des: string;
  provincia_des: string;
  valor_declarado: number;
  peso: number;
  alto: number;
  ancho: number;
  largo: number;
  recoleccion?: string;
  nombre_producto?: string;
}

interface CotizacionResponse {
  valor_declarado: string;
  tiempo: string;
  trayecto: string;
  peso: string;
  volumen: number;
  peso_cobrar: string;
  descuento: number;
  flete: number;
  prima: number;
  tiva: number;
  gtotal: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  console.log("🚀 Servientrega Cotizar - Request received");
  console.log("📍 Method:", req.method);
  console.log("📍 URL:", req.url);

  if (req.method === "OPTIONS") {
    console.log("✅ OPTIONS request - returning CORS headers");
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("🔐 Checking Servientrega credentials...");
    const usuario = Deno.env.get("SERVIENTREGA_USUARIO");
    const contrasena = Deno.env.get("SERVIENTREGA_CONTRASENA");

    console.log("📋 Usuario exists:", !!usuario);
    console.log("📋 Contrasena exists:", !!contrasena);

    if (!usuario || !contrasena) {
      console.error("❌ Servientrega credentials not configured");
      return new Response(
        JSON.stringify({
          error: "Servientrega credentials not configured. Please contact administrator.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("📦 Parsing request body...");
    const body: CotizacionRequest = await req.json();
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    const {
      ciu_ori,
      provincia_ori,
      ciu_des,
      provincia_des,
      valor_declarado,
      peso,
      alto,
      ancho,
      largo,
      recoleccion = "NO",
      nombre_producto = "PREMIER-RESIDENCIAL",
    } = body;

    console.log("✅ Credentials loaded successfully");

    if (!ciu_ori || !provincia_ori || !ciu_des || !provincia_des) {
      console.error("❌ Missing location fields");
      return new Response(
        JSON.stringify({
          error: "Missing required fields: ciu_ori, provincia_ori, ciu_des, provincia_des",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!valor_declarado || !peso || !alto || !ancho || !largo) {
      console.error("❌ Missing dimension/value fields");
      return new Response(
        JSON.stringify({
          error: "Missing required fields: valor_declarado, peso, alto, ancho, largo",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("📋 All required fields present");

    const servientregaPayload = {
      tipo: "obtener_tarifa_nacional",
      ciu_ori,
      provincia_ori,
      ciu_des,
      provincia_des,
      valor_declarado: valor_declarado.toString(),
      peso: peso.toString(),
      alto: alto.toString(),
      ancho: ancho.toString(),
      largo: largo.toString(),
      recoleccion,
      nombre_producto,
      usuingreso: usuario,
      contrasenha: contrasena,
    };

    console.log("🌐 Calling Servientrega API with payload:", {
      ...servientregaPayload,
      contrasenha: "***HIDDEN***",
    });

    const servientregaResponse = await fetch(
      "http://ws-servientrega.appsiscore.com/cotizador/ws_cotizador.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(servientregaPayload),
      }
    );

    console.log("📡 Servientrega API response status:", servientregaResponse.status);

    if (!servientregaResponse.ok) {
      console.error("❌ Servientrega API error:", servientregaResponse.status, servientregaResponse.statusText);
      const errorText = await servientregaResponse.text();
      console.error("❌ Error response body:", errorText);
      return new Response(
        JSON.stringify({
          error: `Servientrega API error: ${servientregaResponse.status} ${servientregaResponse.statusText}`,
        }),
        {
          status: servientregaResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const cotizacionData: CotizacionResponse = await servientregaResponse.json();

    console.log("✅ Servientrega API response:", JSON.stringify(cotizacionData, null, 2));
    console.log("💰 Total calculated:", cotizacionData.gtotal);

    return new Response(
      JSON.stringify({
        success: true,
        cotizacion: cotizacionData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error in servientrega-cotizar function:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
