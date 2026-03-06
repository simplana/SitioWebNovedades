import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderEmailRequest {
  userId?: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderDate: string;
  total: number;
  status: string;
  items: OrderItem[];
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

    const {
      userId,
      customerName,
      customerEmail,
      orderNumber,
      orderDate,
      total,
      status,
      items
    }: OrderEmailRequest = await req.json();

    if (!customerName || !customerEmail || !orderNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: customerName, customerEmail, orderNumber"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the order confirmation email template
    const { data: template, error: templateError } = await supabaseClient
      .from("email_templates")
      .select("*")
      .eq("template_name", "order_confirmation")
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

    // Build items list HTML
    const itemsListHtml = items.map(item => `
      <div style="border-bottom: 1px solid #e2e8f0; padding: 10px 0;">
        <p style="margin: 5px 0; color: #2d3748;">
          <strong>${item.name}</strong>
        </p>
        <p style="margin: 5px 0; color: #718096; font-size: 14px;">
          Cantidad: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}
        </p>
      </div>
    `).join('');

    // Build items list plain text
    const itemsListText = items.map(item =>
      `- ${item.name}\n  Cantidad: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}`
    ).join('\n');

    // Replace variables in the template
    const websiteUrl = "https://novedadescatolicas.com";
    const orderUrl = `${websiteUrl}/orders`;

    let htmlBody = template.html_body
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{order_number\}\}/g, orderNumber)
      .replace(/\{\{order_date\}\}/g, orderDate)
      .replace(/\{\{total\}\}/g, total.toFixed(2))
      .replace(/\{\{status\}\}/g, status)
      .replace(/\{\{items_list\}\}/g, itemsListHtml)
      .replace(/\{\{order_url\}\}/g, orderUrl);

    let textBody = template.text_body
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{order_number\}\}/g, orderNumber)
      .replace(/\{\{order_date\}\}/g, orderDate)
      .replace(/\{\{total\}\}/g, total.toFixed(2))
      .replace(/\{\{status\}\}/g, status)
      .replace(/\{\{items_list\}\}/g, itemsListText)
      .replace(/\{\{order_url\}\}/g, orderUrl);

    let subject = template.subject
      .replace(/\{\{order_number\}\}/g, orderNumber);

    // For now, we'll use Resend API for sending emails
    // You'll need to set up RESEND_API_KEY as a secret
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
            from: "Novedades Católicas <pedidos@novedadescatolicas.com>",
            to: [customerEmail],
            subject: subject,
            html: htmlBody,
            text: textBody,
          }),
        });

        const resendData = await resendResponse.json();

        if (resendResponse.ok) {
          emailSent = true;
          console.log("Email sent successfully via Resend:", resendData);
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
        user_id: userId || null,
        email_type: "order_confirmation",
        recipient_email: customerEmail,
        subject: subject,
        status: emailSent ? "success" : "failed",
        error_message: emailError,
        metadata: {
          customer_name: customerName,
          order_number: orderNumber,
          total: total,
          items_count: items.length,
          template_used: "order_confirmation"
        }
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({
        success: emailSent,
        message: emailSent
          ? "Order confirmation email sent successfully"
          : "Failed to send order confirmation email",
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
    console.error("Error in send-order-confirmation-email function:", error);
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
