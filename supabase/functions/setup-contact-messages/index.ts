import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: string[] = [];

    const { error: createError } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS contact_messages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL DEFAULT '',
          email text NOT NULL DEFAULT '',
          phone text,
          subject text NOT NULL DEFAULT '',
          message text NOT NULL DEFAULT '',
          created_at timestamptz DEFAULT now()
        );
      `,
    });

    if (createError) {
      const { data: pgData, error: pgError } = await supabaseAdmin
        .from("contact_messages")
        .select("id")
        .limit(1);

      if (pgError && pgError.code === "42P01") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Table does not exist and could not be created. Please run the SQL migration manually.",
            sql: `
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a contact message" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view all contact messages" ON contact_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.jwt() ->> 'email'));
            `.trim(),
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      results.push("Table already exists or was created");
    } else {
      results.push("Table created");

      await supabaseAdmin.rpc("exec_sql", {
        sql: `ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;`,
      });

      await supabaseAdmin.rpc("exec_sql", {
        sql: `
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Anyone can submit a contact message') THEN
              CREATE POLICY "Anyone can submit a contact message" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
            END IF;
          END $$;
        `,
      });

      await supabaseAdmin.rpc("exec_sql", {
        sql: `
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'Admins can view all contact messages') THEN
              CREATE POLICY "Admins can view all contact messages" ON contact_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.jwt() ->> 'email'));
            END IF;
          END $$;
        `,
      });

      results.push("RLS and policies configured");
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
