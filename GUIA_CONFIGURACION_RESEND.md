# Guía de Configuración de Resend para Producción

## Estado Actual

Las funciones de email ya están configuradas y listas para usar el dominio `novedadescatolicas.com`. Solo falta completar estos pasos en Resend:

## Paso 1: Crear Cuenta en Resend

1. Ve a https://resend.com
2. Haz clic en "Sign Up" (Registrarse)
3. Completa el registro con tu email

## Paso 2: Obtener tu API Key

1. Una vez dentro del dashboard, ve a **API Keys** en el menú lateral
2. Haz clic en **Create API Key**
3. Dale un nombre como "Novedades Catolicas Production"
4. Selecciona permisos: **Sending access**
5. Haz clic en **Add**
6. **IMPORTANTE**: Copia la API key que aparece (solo la verás una vez)
   - Tendrá formato: `re_xxxxxxxxxxxxxxxxxxxxx`

## Paso 3: Verificar tu Dominio en Resend

1. En el dashboard de Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa: `novedadescatolicas.com`
4. Haz clic en **Add**

Resend te mostrará 3 registros DNS que debes configurar:

### Registros DNS a Configurar

Resend te dará valores específicos, pero el formato será algo así:

```
Tipo: TXT
Nombre: @ (o tu dominio raíz)
Valor: v=spf1 include:resend.com ~all
TTL: 3600
```

```
Tipo: CNAME
Nombre: resend._domainkey
Valor: xxxxx.resend.com (Resend te dará el valor exacto)
TTL: 3600
```

```
Tipo: TXT
Nombre: _dmarc
Valor: v=DMARC1; p=none; pct=100; rua=mailto:dmarc@novedadescatolicas.com
TTL: 3600
```

## Paso 4: Configurar DNS en tu Proveedor

Esto depende de dónde tengas registrado tu dominio `novedadescatolicas.com`:

### Si usas GoDaddy:
1. Inicia sesión en GoDaddy
2. Ve a **Mis Productos** → **DNS**
3. Haz clic en **Administrar DNS** junto a tu dominio
4. Agrega cada uno de los registros que Resend te dio

### Si usas Namecheap:
1. Inicia sesión en Namecheap
2. Ve a **Domain List** → Selecciona tu dominio
3. Haz clic en **Manage** → **Advanced DNS**
4. Agrega cada uno de los registros

### Si usas Cloudflare:
1. Inicia sesión en Cloudflare
2. Selecciona tu dominio
3. Ve a la pestaña **DNS**
4. Agrega cada uno de los registros

**Nota**: La propagación DNS puede tomar de 15 minutos a 48 horas

## Paso 5: Verificar el Dominio

1. Regresa al dashboard de Resend
2. Ve a **Domains**
3. Haz clic en **Verify** junto a tu dominio
4. Si configuraste todo correctamente, verás un check verde

Si no verifica inmediatamente:
- Espera unos minutos y vuelve a intentar
- La verificación puede tomar hasta 48 horas

## Paso 6: Configurar el API Key en Supabase

Ahora que tienes tu API key de Resend, debes configurarla como secreto en Supabase.

### Opción A: Usar la Interfaz Web de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Project Settings** (ícono de engranaje)
4. Haz clic en **Edge Functions**
5. Ve a la sección **Secrets**
6. Haz clic en **Add new secret**
7. Nombre: `RESEND_API_KEY`
8. Valor: Pega tu API key (el que copiaste en el Paso 2)
9. Haz clic en **Save**

### Opción B: Usar Supabase CLI (si tienes acceso local)

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

Reemplaza `re_xxxxxxxxxxxxxxxxxxxxx` con tu API key real.

## Paso 7: Verificar la Configuración

Una vez completados todos los pasos anteriores:

1. Las tablas de email ya están creadas en tu base de datos
2. Las funciones ya están configuradas para usar `noreply@novedadescatolicas.com`
3. El dominio está verificado en Resend
4. El API key está configurado en Supabase

Para verificar que todo funciona:

### Probar Email de Bienvenida

Regístrate en tu aplicación con un nuevo usuario y deberías recibir el email de bienvenida.

### Probar Email de Confirmación de Orden

Realiza una compra de prueba y deberías recibir el email de confirmación.

### Ver Logs de Email

Puedes revisar los logs en el SQL Editor de Supabase:

```sql
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
```

## Resumen de lo que Necesitas

### De Resend:
- ✅ Cuenta creada
- ✅ API Key generada
- ✅ Dominio verificado

### En Supabase:
- ✅ Tablas creadas (email_templates, email_logs)
- ✅ Funciones desplegadas (send-welcome-email, send-order-confirmation-email)
- ✅ Secret RESEND_API_KEY configurado

### En tu Proveedor DNS:
- ✅ Registros SPF, DKIM y DMARC configurados

## Troubleshooting

### "Domain not verified"
- Verifica que agregaste correctamente los registros DNS
- Espera hasta 48 horas para la propagación
- Usa https://mxtoolbox.com/SuperTool.aspx para verificar tus registros DNS

### "Invalid API Key"
- Verifica que copiaste el API key completo
- Asegúrate de que el secret en Supabase se llame exactamente `RESEND_API_KEY`
- Verifica que el API key tenga permisos de "Sending access"

### Los emails no llegan
- Revisa la tabla `email_logs` para ver errores
- Verifica que el dominio esté verificado en Resend
- Revisa la carpeta de spam
- Verifica que el API key esté configurado correctamente

### Los emails van a spam
- Esto puede suceder inicialmente
- Asegúrate de que DMARC, SPF y DKIM estén configurados
- Con el tiempo, tu reputación de envío mejorará

## Links Útiles

- Dashboard de Resend: https://resend.com/overview
- API Keys: https://resend.com/api-keys
- Dominios: https://resend.com/domains
- Documentación: https://resend.com/docs
- Verificar DNS: https://mxtoolbox.com/SuperTool.aspx
