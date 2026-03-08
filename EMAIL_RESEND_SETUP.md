# Configuración de Resend para Emails

## El Problema

Resend no permite enviar emails desde dominios no verificados como `@gmail.com`. Necesitas usar un dominio verificado.

## Solución Rápida (Para Pruebas)

Las funciones ya están configuradas para usar `onboarding@resend.dev`, que es el dominio de prueba de Resend.

**⚠️ IMPORTANTE**: Este dominio SOLO enviará emails a la dirección de email que usaste para registrarte en Resend.

### Pasos:

1. **Redesplegar las funciones** (ya actualizadas con el dominio correcto):
   ```bash
   ./redeploy-email-functions.sh
   ```

   O manualmente:
   ```bash
   supabase functions deploy send-welcome-email --no-verify-jwt
   supabase functions deploy send-order-confirmation-email --no-verify-jwt
   ```

2. **Configurar el API Key de Resend** (si no lo has hecho):
   ```bash
   supabase secrets set RESEND_API_KEY=tu_api_key_de_resend
   ```

3. **Probar el sistema**:
   - Regístrate con el MISMO email que usaste en Resend
   - Deberías recibir el email de bienvenida
   - Haz una compra y recibirás el email de confirmación

## Solución para Producción

Para enviar emails a cualquier dirección, necesitas verificar tu propio dominio.

### Pasos:

1. **Verificar tu dominio en Resend**:
   - Ve a https://resend.com/domains
   - Haz clic en "Add Domain"
   - Ingresa: `novedadescatolicas.com`
   - Resend te dará registros DNS para configurar

2. **Configurar DNS**:
   En tu proveedor de DNS (donde compraste el dominio), agrega estos registros:

   ```
   Tipo: TXT
   Host: @
   Valor: [El valor SPF que te da Resend]

   Tipo: CNAME
   Host: resend._domainkey
   Valor: [El valor DKIM que te da Resend]
   ```

3. **Esperar verificación**:
   - Puede tomar hasta 48 horas
   - Resend verificará automáticamente
   - Recibirás un email cuando esté verificado

4. **Actualizar las funciones**:
   Una vez verificado tu dominio, actualiza ambas funciones:

   **En `send-welcome-email/index.ts` (línea ~95):**
   ```typescript
   from: "Novedades Católicas <noreply@novedadescatolicas.com>",
   ```

   **En `send-order-confirmation-email/index.ts` (línea ~144):**
   ```typescript
   from: "Novedades Católicas <noreply@novedadescatolicas.com>",
   ```

5. **Redesplegar**:
   ```bash
   ./redeploy-email-functions.sh
   ```

## Verificar que funciona

### 1. Crear las tablas SQL

Si no lo has hecho, ejecuta en el SQL Editor de Supabase:

```sql
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer plantillas"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo service role puede modificar plantillas"
  ON email_templates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden ver sus propios logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role puede todo en logs"
  ON email_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Insertar las plantillas

Ejecuta el SQL del archivo que te proporcioné anteriormente con las plantillas de welcome_email y order_confirmation.

### 3. Revisar los logs

Para ver si los emails se están enviando:

```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;
```

## Troubleshooting

### "The gmail.com domain is not verified"
- Estás usando el dominio incorrecto
- Asegúrate de redesplegar las funciones después de cambiar a `onboarding@resend.dev`

### "RESEND_API_KEY not configured"
- Configura el secret: `supabase secrets set RESEND_API_KEY=tu_key`

### No recibo emails (usando onboarding@resend.dev)
- Solo recibirás emails en la dirección que usaste para registrarte en Resend
- Verifica que estés usando ese mismo email para registrarte/comprar

### Emails van a spam
- Esto es normal con el dominio de prueba
- Una vez verifiques tu propio dominio, los emails llegarán a la bandeja principal

## Recursos

- Dashboard de Resend: https://resend.com/overview
- Documentación de dominios: https://resend.com/docs/dashboard/domains/introduction
- API Keys: https://resend.com/api-keys
