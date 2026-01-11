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
  paymentCode?: string;
  message?: string;
  error?: string;
}

// Helper function to encode string to hexadecimal
function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex.toUpperCase();
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

    // Get Paguelo Facil credentials from environment
    const pagueloFacilCCLW = Deno.env.get("PAGUELO_FACIL_CCLW");
    const pagueloFacilEnvironment = Deno.env.get("PAGUELO_FACIL_ENVIRONMENT") || "sandbox";

    // Determine the correct API URL based on environment
    const pagueloFacilApiUrl = pagueloFacilEnvironment === "production"
      ? "https://secure.paguelofacil.com"
      : "https://sandbox.paguelofacil.com";

    if (!pagueloFacilCCLW) {
      console.error("PAGUELO_FACIL_CCLW not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured. Please add PAGUELO_FACIL_CCLW to environment variables." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Creating payment link with Paguelo Fácil for order: ${paymentData.id}`);
    console.log(`Environment: ${pagueloFacilEnvironment}, API URL: ${pagueloFacilApiUrl}`);

    // Encode RETURN_URL in hexadecimal as per documentation
    const returnUrlHex = stringToHex(paymentData.redirectUrls.success);

    // Build form-urlencoded payload according to Paguelo Facil LinkDeamon.cfm documentation
    const formData = new URLSearchParams();
    formData.append("CCLW", pagueloFacilCCLW);
    formData.append("CMTN", paymentData.amount.toFixed(2));
    formData.append("CDSC", paymentData.description);
    formData.append("RETURN_URL", returnUrlHex);
    formData.append("PARM_1", paymentData.id); // Order ID as custom parameter
    formData.append("EXPIRES_IN", "3600"); // 1 hour expiration

    // Make request to LinkDeamon.cfm endpoint
    console.log(`Sending request to: ${pagueloFacilApiUrl}/LinkDeamon.cfm`);
    console.log(`Form data: CCLW=${pagueloFacilCCLW.substring(0, 10)}..., CMTN=${paymentData.amount.toFixed(2)}, CDSC=${paymentData.description.substring(0, 30)}...`);

    const pagueloFacilResponse = await fetch(`${pagueloFacilApiUrl}/LinkDeamon.cfm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*",
      },
      body: formData.toString(),
    });

    console.log(`Paguelo Fácil response status: ${pagueloFacilResponse.status}`);
    console.log(`Response headers: ${JSON.stringify(Object.fromEntries(pagueloFacilResponse.headers.entries()))}`);

    if (!pagueloFacilResponse.ok) {
      const errorText = await pagueloFacilResponse.text();
      console.error("Paguelo Fácil error response:", errorText);
      console.error("Full error details - Status:", pagueloFacilResponse.status, "StatusText:", pagueloFacilResponse.statusText);

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

    const responseText = await pagueloFacilResponse.text();
    console.log(`Raw response from Paguelo Fácil: ${responseText.substring(0, 500)}...`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.error("Response was:", responseText);

      return new Response(JSON.stringify({
        success: false,
        paymentId: "",
        paymentUrl: "",
        error: "Invalid response from payment service. Please contact support."
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Parsed response:", JSON.stringify(responseData));

    // Check if response is successful
    if (!responseData.success || !responseData.data || !responseData.data.url) {
      console.error("Invalid response structure from Paguelo Fácil:", responseData);

      const response: PagueloFacilResponse = {
        success: false,
        paymentId: "",
        paymentUrl: "",
        error: responseData.message || "Failed to create payment link",
      };

      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentUrl = responseData.data.url;
    const paymentCode = responseData.data.code; // Format: LK-XXXXXXXXXXXXX

    console.log(`Payment link created successfully. Code: ${paymentCode}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from("audit_logs").insert({
          event_type: "payment_link_created",
          user_id: null,
          metadata: {
            payment_code: paymentCode,
            order_reference: paymentData.id,
            amount: paymentData.amount,
            currency: paymentData.currency || "USD",
            timestamp: new Date().toISOString(),
            environment: pagueloFacilEnvironment,
          },
          severity: "medium",
        });

        console.log("Audit log created successfully");
      } catch (error) {
        console.error("Failed to log audit event:", error);
      }
    }

    const response: PagueloFacilResponse = {
      success: true,
      paymentId: paymentCode,
      paymentUrl: paymentUrl,
      paymentCode: paymentCode,
      message: "Payment link created successfully",
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
