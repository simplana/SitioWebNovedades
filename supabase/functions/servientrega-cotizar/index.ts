import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface CotizacionRequest {
  ciu_ori: string;
  provincia_ori: string;
  ciu_des: string;
  provincia_des: string;
  valor_declarado: number;
  peso: number;
  alto?: number;
  ancho?: number;
  largo?: number;
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
  console.log("Servientrega Cotizar - Request received");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  if (req.method === "OPTIONS") {
    console.log("OPTIONS request");
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("Checking Servientrega credentials...");
    const usuario = Deno.env.get("SERVIENTREGA_USUARIO");
    const contrasena = Deno.env.get("SERVIENTREGA_CONTRASENA");

    console.log("Usuario exists:", !!usuario);
    console.log("Contrasena exists:", !!contrasena);

    if (!usuario || !contrasena) {
      console.error("Missing Servientrega credentials");
      return new Response(
        JSON.stringify({ error: "Servientrega credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsing request body...");
    const body: CotizacionRequest = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const {
      ciu_ori,
      provincia_ori,
      ciu_des,
      provincia_des,
      valor_declarado,
      peso,
      alto = 20,
      ancho = 25,
      largo = 30,
      recoleccion = "NO",
      nombre_producto = "PREMIER-RESIDENCIAL",
    } = body;

    console.log("Dimensions:", { alto, ancho, largo });

    console.log("Preparing Servientrega payload...");

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

    console.log("Sending payload:", {
      ...servientregaPayload,
      contrasenha: "***HIDDEN***",
    });

    const response = await fetch(
      "http://ws-servientrega.appsiscore.com/cotizador/ws_cotizador.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(servientregaPayload),
      }
    );

    console.log("Servientrega response status:", response.status);

    const rawText = await response.text();
    console.log("Raw response:", rawText);

    const cleanText = rawText.replace(/^\uFEFF/, "");
    console.log("Clean response:", cleanText);

    let cotizacion: CotizacionResponse;

    try {
      cotizacion = JSON.parse(cleanText);
      console.log("Parsed JSON:", cotizacion);
    } catch (err) {
      console.error("JSON parse failed");
      console.error("Error:", err);
      return new Response(
        JSON.stringify({
          error: "Servientrega returned invalid JSON",
          raw: cleanText,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Total (gtotal):", cotizacion.gtotal);

    return new Response(
      JSON.stringify({
        success: true,
        gtotal: cotizacion.gtotal,
        cotizacion,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
