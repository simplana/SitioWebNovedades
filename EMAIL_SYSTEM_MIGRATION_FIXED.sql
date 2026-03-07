/*
  # Email System Migration (FIXED)

  This migration creates the email system for Novedades Católicas.

  Execute this in your Supabase SQL Editor.

  1. New Tables
    - email_templates: Store reusable email templates
    - email_logs: Track all emails sent

  2. Security
    - RLS enabled on both tables
    - Admins manage templates (checks by email from auth.users)
    - Users view their own logs
*/

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Only admins can view email templates" ON email_templates;
DROP POLICY IF EXISTS "Only admins can insert email templates" ON email_templates;
DROP POLICY IF EXISTS "Only admins can update email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
DROP POLICY IF EXISTS "Service role can insert email logs" ON email_logs;

-- RLS Policies for email_templates
-- FIXED: Check admin by comparing email from auth.users with admin_users.email
CREATE POLICY "Only admins can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (
        SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
      )
    )
  );

CREATE POLICY "Only admins can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (
        SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
      )
    )
  );

CREATE POLICY "Only admins can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (
        SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = (
        SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
      )
    )
  );

-- RLS Policies for email_logs
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default welcome email template
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables)
VALUES (
  'welcome_email',
  '¡Bienvenido a Novedades Católicas!',
  '<html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a365d;">¡Bienvenido a Novedades Católicas!</h1>
      </div>
      <div style="background-color: #f7fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <p style="font-size: 16px; color: #2d3748;">Hola {{name}},</p>
        <p style="font-size: 16px; color: #2d3748;">
          Gracias por crear tu cuenta en Novedades Católicas. Estamos emocionados de tenerte con nosotros.
        </p>
        <p style="font-size: 16px; color: #2d3748;">
          Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a explorar nuestro catálogo de productos religiosos.
        </p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{website_url}}" style="background-color: #d4af37; color: #1a365d; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
          Explorar Productos
        </a>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 14px; color: #718096; text-align: center;">
          Si tienes alguna pregunta, no dudes en contactarnos por WhatsApp.
        </p>
        <p style="font-size: 14px; color: #718096; text-align: center;">
          Bendiciones,<br>
          <strong>El equipo de Novedades Católicas</strong>
        </p>
      </div>
    </body>
  </html>',
  'Hola {{name}},

Gracias por crear tu cuenta en Novedades Católicas. Estamos emocionados de tenerte con nosotros.

Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a explorar nuestro catálogo de productos religiosos.

Visita: {{website_url}}

Si tienes alguna pregunta, no dudes en contactarnos por WhatsApp.

Bendiciones,
El equipo de Novedades Católicas',
  '["name", "email", "website_url"]'::jsonb
)
ON CONFLICT (template_name) DO NOTHING;

-- Insert order confirmation email template
INSERT INTO email_templates (template_name, subject, html_body, text_body, variables)
VALUES (
  'order_confirmation',
  'Confirmación de Orden #{{order_number}}',
  '<html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a365d;">¡Tu orden ha sido procesada!</h1>
      </div>
      <div style="background-color: #f7fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <p style="font-size: 16px; color: #2d3748;">Hola {{customer_name}},</p>
        <p style="font-size: 16px; color: #2d3748;">
          Hemos recibido tu orden <strong style="color: #d4af37;">#{{order_number}}</strong> exitosamente.
        </p>
      </div>
      <div style="background-color: #fff; border: 2px solid #d4af37; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #1a365d; margin-top: 0;">Detalles de tu Orden</h2>
        <div style="margin-bottom: 15px;">
          <p style="margin: 5px 0; color: #2d3748;"><strong>Número de Orden:</strong> {{order_number}}</p>
          <p style="margin: 5px 0; color: #2d3748;"><strong>Fecha:</strong> {{order_date}}</p>
          <p style="margin: 5px 0; color: #2d3748;"><strong>Total:</strong> ${{total}}</p>
          <p style="margin: 5px 0; color: #2d3748;"><strong>Estado:</strong> {{status}}</p>
        </div>
      </div>
      <div style="background-color: #f7fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #1a365d; margin-top: 0;">Productos Ordenados:</h3>
        {{items_list}}
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{order_url}}" style="background-color: #d4af37; color: #1a365d; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
          Ver Estado de Orden
        </a>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 14px; color: #718096; text-align: center;">
          Te contactaremos pronto para coordinar la entrega.
        </p>
        <p style="font-size: 14px; color: #718096; text-align: center;">
          Bendiciones,<br>
          <strong>El equipo de Novedades Católicas</strong>
        </p>
      </div>
    </body>
  </html>',
  'Hola {{customer_name}},

Hemos recibido tu orden #{{order_number}} exitosamente.

DETALLES DE TU ORDEN:
- Número de Orden: {{order_number}}
- Fecha: {{order_date}}
- Total: ${{total}}
- Estado: {{status}}

PRODUCTOS ORDENADOS:
{{items_list}}

Te contactaremos pronto para coordinar la entrega.

Ver estado de orden: {{order_url}}

Bendiciones,
El equipo de Novedades Católicas',
  '["customer_name", "order_number", "order_date", "total", "status", "items_list", "order_url"]'::jsonb
)
ON CONFLICT (template_name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_templates
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
