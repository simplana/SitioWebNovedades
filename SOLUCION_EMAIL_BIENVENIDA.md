# Solución: Email de Bienvenida No Llega

## Diagnóstico

He revisado tu sistema y encontré que:

1. ✅ Las Edge Functions están desplegadas correctamente (send-welcome-email v5)
2. ✅ El código frontend llama a la función automáticamente al registrarse
3. ⚠️ Posibles problemas:
   - La tabla `email_templates` podría no existir
   - El secret `RESEND_API_KEY` podría no estar configurado en Supabase

## Solución Paso a Paso

### Paso 1: Crear las Tablas de Email en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Copia el contenido del archivo `EMAIL_SYSTEM_MIGRATION_FIXED.sql`
4. Pégalo en el editor SQL
5. Haz clic en **Run** para ejecutar

Esto creará:
- Tabla `email_templates` con los templates de bienvenida y confirmación de orden
- Tabla `email_logs` para registrar todos los emails enviados
- Políticas de seguridad RLS

### Paso 2: Configurar RESEND_API_KEY en Supabase

Tu archivo `.env` local tiene la clave:
```
RESEND_API_KEY=re_6mHcXSbd_Dwi64UcPbUBF1XhrPNzXuFkR
```

Pero esta clave también debe estar configurada en Supabase para las Edge Functions:

**Opción A: Usar Supabase CLI (Recomendado)**

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Iniciar sesión
supabase login

# Configurar el secret
supabase secrets set RESEND_API_KEY=re_6mHcXSbd_Dwi64UcPbUBF1XhrPNzXuFkR --project-ref iabrhkvwhmliemgioxce
```

**Opción B: Usar Supabase Dashboard**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings** > **Edge Functions** > **Secrets**
3. Haz clic en **Add secret**
4. Nombre: `RESEND_API_KEY`
5. Valor: `re_6mHcXSbd_Dwi64UcPbUBF1XhrPNzXuFkR`
6. Guarda

### Paso 3: Verificar la Configuración de Resend

1. Ve a [Resend Dashboard](https://resend.com/domains)
2. Verifica que el dominio `noreply@novedadescatolicas.com` esté configurado
   - Si no tienes dominio propio, Resend proporciona un dominio de prueba
   - Puedes enviar emails desde `onboarding@resend.dev` para pruebas

### Paso 4: Probar el Email Manualmente

He creado un script de prueba. Ejecútalo así:

```bash
chmod +x test-welcome-email-manual.sh
./test-welcome-email-manual.sh
```

Te pedirá:
- User ID (UUID del usuario que creaste)
- Email del usuario
- Nombre del usuario

Para obtener el User ID del usuario que creaste:

1. Ve a Supabase Dashboard > **Authentication** > **Users**
2. Busca tu usuario por email
3. Copia el UUID

O ejecuta esto en SQL Editor:

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

### Paso 5: Verificar los Logs

Después de probar, verifica si el email se envió:

```sql
-- Ver los últimos emails intentados
SELECT * FROM email_logs
ORDER BY sent_at DESC
LIMIT 10;

-- Ver solo emails fallidos
SELECT * FROM email_logs
WHERE status = 'failed'
ORDER BY sent_at DESC;
```

## Verificación Rápida

Para ver si todo está configurado correctamente, ejecuta estos queries en Supabase SQL Editor:

```sql
-- 1. Verificar que existen las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('email_templates', 'email_logs');

-- 2. Verificar que existen los templates
SELECT template_name, subject
FROM email_templates;

-- 3. Ver el último intento de email
SELECT * FROM email_logs
ORDER BY sent_at DESC
LIMIT 1;
```

## Próximos Pasos

Una vez configurado todo:

1. Crea una cuenta nueva desde la app
2. Revisa tu email (incluyendo spam)
3. Si no llega, verifica:
   - Los logs en `email_logs`
   - La consola del navegador para ver errores
   - Los logs de la Edge Function en Supabase Dashboard

## Notas Importantes

- **Límites de Resend**: Plan gratuito tiene 100 emails/día, 3000/mes
- **Dominio**: Para producción, configura un dominio propio en Resend
- **Spam**: Los emails podrían caer en spam hasta que configures SPF/DKIM en tu dominio
- **Testing**: Usa un email real para pruebas (no emails temporales)

## Alternativa: Usar el Dashboard de Supabase

Si prefieres verificar manualmente:

1. Ve a **Edge Functions** en tu Supabase Dashboard
2. Selecciona `send-welcome-email`
3. Usa el botón **Invoke** para probar con este JSON:

```json
{
  "userId": "tu-user-id-aqui",
  "email": "tu-email@ejemplo.com",
  "name": "Tu Nombre"
}
```

## Solución de Problemas

### Error: "Email template not found"
- Ejecuta el archivo `EMAIL_SYSTEM_MIGRATION_FIXED.sql` en SQL Editor

### Error: "RESEND_API_KEY not configured"
- Configura el secret en Supabase (Paso 2)

### Email enviado pero no llega
- Revisa tu carpeta de spam
- Verifica que el dominio esté configurado en Resend
- Usa el dominio de prueba de Resend: `onboarding@resend.dev`

### CORS errors
- Las Edge Functions ya tienen CORS configurado correctamente
- Verifica que usas la URL correcta: `https://iabrhkvwhmliemgioxce.supabase.co`
