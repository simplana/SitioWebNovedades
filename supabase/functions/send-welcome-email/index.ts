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

    // Send email using Supabase's built-in email service
    const { error: emailError } = await supabaseClient.auth.admin.generateLink({
      type: 'email',
      email: email,
      options: {
        redirectTo: websiteUrl,
      }
    });

    // Since Supabase Auth doesn't support custom email content via API,
    // we'll log the email for now and you'll need to configure SMTP settings
    // in your Supabase dashboard to customize emails

    // Log the email
    const { error: logError } = await supabaseClient
      .from("email_logs")
      .insert({
        user_id: userId,
        email_type: "welcome_email",
        recipient_email: email,
        subject: subject,
        status: emailError ? "failed" : "success",
        error_message: emailError?.message || null,
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
        success: !emailError,
        message: emailError
          ? "Failed to send welcome email"
          : "Welcome email sent successfully",
        error: emailError?.message || null,
        note: "To customize email templates, configure SMTP settings in Supabase Dashboard > Authentication > Email Templates"
      }),
      {
        status: emailError ? 500 : 200,
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
