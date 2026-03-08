import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  name: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, email, name }: WelcomeEmailRequest = await req.json();

    if (!userId || !email || !name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: userId, email, name"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the welcome email template from the database
    const { data: template, error: templateError } = await supabaseClient
      .from("email_templates")
      .select("*")
      .eq("template_name", "welcome_email")
      .single();

    if (templateError || !template) {
      console.error("Error fetching template:", templateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email template not found"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Replace variables in the template
    const websiteUrl = "https://novedadescatolicas.com";
    let htmlBody = template.html_body
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{website_url\}\}/g, websiteUrl);

    let textBody = template.text_body
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{website_url\}\}/g, websiteUrl);

    let subject = template.subject;

    // Send email using Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    let emailSent = false;
    let emailError = null;

    if (resendApiKey) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Novedades Católicas <noreply@novedadescatolicas.com>",
            to: [email],
            subject: subject,
            html: htmlBody,
            text: textBody,
          }),
        });

        const resendData = await resendResponse.json();

        if (resendResponse.ok) {
          emailSent = true;
          console.log("Welcome email sent successfully via Resend:", resendData);
        } else {
          emailError = resendData.message || "Failed to send email via Resend";
          console.error("Resend API error:", resendData);
        }
      } catch (error) {
        emailError = error.message;
        console.error("Error sending email via Resend:", error);
      }
    } else {
      emailError = "RESEND_API_KEY not configured";
      console.warn("RESEND_API_KEY not found. Email not sent.");
    }

    // Log the email attempt
    const { error: logError } = await supabaseClient
      .from("email_logs")
      .insert({
        user_id: userId,
        email_type: "welcome_email",
        recipient_email: email,
        subject: subject,
        status: emailSent ? "success" : "failed",
        error_message: emailError,
        metadata: {
          name: name,
          template_used: "welcome_email"
        }
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({
        success: emailSent,
        message: emailSent
          ? "Welcome email sent successfully"
          : "Failed to send welcome email",
        error: emailError,
        note: resendApiKey
          ? null
          : "Configure RESEND_API_KEY secret in Supabase to enable email sending. Get your API key from https://resend.com"
      }),
      {
        status: emailSent ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
