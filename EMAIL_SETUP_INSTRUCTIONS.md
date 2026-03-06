# Sistema de Correos Electrónicos - Novedades Católicas

Este documento explica cómo configurar y usar el sistema de correos electrónicos para enviar correos de bienvenida y confirmación de órdenes.

## 📋 Componentes del Sistema

### 1. Base de Datos
- **email_templates**: Almacena plantillas de correo reutilizables
- **email_logs**: Registra todos los correos enviados

### 2. Edge Functions
- **send-welcome-email**: Envía correo de bienvenida al crear cuenta
- **send-order-confirmation-email**: Envía confirmación de orden

### 3. Integraciones Frontend
- Hook `useAuth`: Envía correo de bienvenida después del registro
- Hook `useCart`: Envía confirmación de orden después de procesar la compra

## 🚀 Pasos de Configuración

### Paso 1: Configurar Base de Datos

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor**
3. Abre el archivo `EMAIL_SYSTEM_MIGRATION.sql`
4. Copia todo el contenido
5. Pégalo en el editor SQL de Supabase
6. Haz clic en **Run** para ejecutar la migración

Esto creará:
- Las tablas `email_templates` y `email_logs`
- Políticas de seguridad RLS
- Plantillas predeterminadas de correos

### Paso 2: Desplegar Edge Functions

Debes desplegar las funciones Edge manualmente usando Supabase CLI:

```bash
# Si no tienes Supabase CLI instalado
npm install -g supabase

# Inicia sesión en Supabase
supabase login

# Enlaza tu proyecto (reemplaza con tu ID de proyecto)
supabase link --project-ref iabrhkvwhmliemgioxce

# Despliega las funciones
supabase functions deploy send-welcome-email
supabase functions deploy send-order-confirmation-email
```

### Paso 3: Configurar Servicio de Email (IMPORTANTE)

Para enviar correos reales, necesitas configurar un servicio de email. Recomendamos **Resend** por su simplicidad:

#### Opción A: Usar Resend (Recomendado)

1. Crea una cuenta en [Resend.com](https://resend.com)
2. Obtén tu API Key desde el dashboard
3. Configura el secreto en Supabase:

```bash
# Usando Supabase CLI
supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui

# O desde Supabase Dashboard:
# Settings > Edge Functions > Secrets > Add secret
# Name: RESEND_API_KEY
# Value: tu_api_key_de_resend
```

4. Verifica tu dominio de Gmail en Resend
   - El sistema está configurado para usar: `novedades.mariareinadelapaz@gmail.com`
   - Ve a Domains en Resend
   - Añade gmail.com como dominio verificado (o usa el dominio predeterminado de Resend)
   - Nota: Gmail personal tiene limitaciones. Para producción, considera usar un dominio propio

#### Opción B: Usar SMTP Personalizado de Supabase

1. Ve a **Authentication > Email Templates** en tu Supabase Dashboard
2. Configura los ajustes de SMTP:
   - Host SMTP
   - Puerto
   - Usuario
   - Contraseña
3. Las plantillas se configurarán desde allí

## 📧 Plantillas de Email Incluidas

### 1. Welcome Email (Correo de Bienvenida)
- **Template Name**: `welcome_email`
- **Se envía**: Al crear una cuenta nueva
- **Variables**: name, email, website_url

### 2. Order Confirmation (Confirmación de Orden)
- **Template Name**: `order_confirmation`
- **Se envía**: Al procesar una compra
- **Variables**: customer_name, order_number, order_date, total, status, items_list, order_url

## 🔄 Flujo de Envío de Correos

### Correo de Bienvenida
```
Usuario registra cuenta
    ↓
useAuth.signUpWithEmail() se ejecuta
    ↓
Llama a /functions/v1/send-welcome-email
    ↓
Edge Function obtiene plantilla de BD
    ↓
Reemplaza variables en plantilla
    ↓
Envía email usando Resend API
    ↓
Registra en email_logs
```

### Confirmación de Orden
```
Usuario completa checkout
    ↓
useCart.processOrder() se ejecuta
    ↓
Crea orden en BD
    ↓
Llama a /functions/v1/send-order-confirmation-email
    ↓
Edge Function obtiene plantilla de BD
    ↓
Reemplaza variables en plantilla
    ↓
Envía email usando Resend API
    ↓
Registra en email_logs
```

## 🛠️ Personalizar Plantillas

### Desde la Base de Datos

Puedes actualizar las plantillas directamente en Supabase:

```sql
UPDATE email_templates
SET
  subject = 'Nuevo asunto aquí',
  html_body = '<html>...</html>',
  text_body = 'Versión texto...'
WHERE template_name = 'welcome_email';
```

### Variables Disponibles

Usa `{{variable_name}}` en tus plantillas:

**Welcome Email**:
- `{{name}}` - Nombre del usuario
- `{{email}}` - Email del usuario
- `{{website_url}}` - URL del sitio web

**Order Confirmation**:
- `{{customer_name}}` - Nombre del cliente
- `{{order_number}}` - Número de orden
- `{{order_date}}` - Fecha de la orden
- `{{total}}` - Total de la orden
- `{{status}}` - Estado de la orden
- `{{items_list}}` - Lista de productos (HTML/texto)
- `{{order_url}}` - URL para ver la orden

## 📊 Monitorear Emails

Puedes ver el historial de correos enviados:

```sql
-- Ver todos los correos enviados
SELECT * FROM email_logs
ORDER BY sent_at DESC
LIMIT 50;

-- Ver correos fallidos
SELECT * FROM email_logs
WHERE status = 'failed'
ORDER BY sent_at DESC;

-- Ver correos por usuario
SELECT * FROM email_logs
WHERE user_id = 'user-id-aqui'
ORDER BY sent_at DESC;
```

O desde tu panel de admin, si creas una interfaz para ello.

## 🧪 Pruebas

### Probar Correo de Bienvenida
1. Crea una cuenta nueva en tu aplicación
2. Revisa la consola del navegador para ver el resultado
3. Verifica tu email
4. Revisa `email_logs` en Supabase

### Probar Confirmación de Orden
1. Añade productos al carrito
2. Completa el checkout
3. Revisa la consola del navegador
4. Verifica tu email
5. Revisa `email_logs` en Supabase

## ⚠️ Notas Importantes

1. **Sin Resend API Key**: Los correos se registrarán en `email_logs` pero no se enviarán realmente. Verás un mensaje en la consola.

2. **Límites de Resend**:
   - Plan gratuito: 100 emails/día, 3,000/mes
   - Para producción, considera un plan de pago

3. **Personalización del Remitente**:
   - El sistema usa: `novedades.mariareinadelapaz@gmail.com`
   - Para producción, considera verificar un dominio propio en Resend

4. **Testing**:
   - En desarrollo, usa un email de prueba
   - Resend tiene un modo sandbox

## 🎨 Próximos Pasos

1. **Más Plantillas**: Crea plantillas para:
   - Recuperación de contraseña
   - Orden enviada
   - Orden entregada
   - Newsletter

2. **Programar Emails**: Usa Supabase Functions con cron jobs

3. **Email Marketing**: Integra con servicios como Mailchimp o SendGrid

4. **Notificaciones Admin**: Envía notificaciones al admin cuando hay nuevas órdenes

## 🆘 Solución de Problemas

### Los correos no se envían

1. Verifica que `RESEND_API_KEY` esté configurado:
```bash
supabase secrets list
```

2. Revisa los logs de la función:
```bash
supabase functions logs send-order-confirmation-email
```

3. Verifica `email_logs` para ver errores:
```sql
SELECT * FROM email_logs WHERE status = 'failed';
```

### Error "template not found"

1. Verifica que ejecutaste `EMAIL_SYSTEM_MIGRATION.sql`
2. Confirma que las plantillas existen:
```sql
SELECT * FROM email_templates;
```

### Funciones Edge no disponibles

1. Asegúrate de haber desplegado las funciones:
```bash
supabase functions deploy send-welcome-email
supabase functions deploy send-order-confirmation-email
```

2. Verifica que las funciones aparezcan en tu Supabase Dashboard > Edge Functions

## 📞 Soporte

Si tienes problemas, revisa:
- [Documentación de Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentación de Resend](https://resend.com/docs)
- Logs en Supabase Dashboard
