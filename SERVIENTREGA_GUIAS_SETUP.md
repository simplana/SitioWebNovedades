# Configuración de Generación de Guías de Servientrega

## Pasos de Instalación

### 1. Ejecutar la Migración SQL

Ejecuta el archivo `ADD_SERVIENTREGA_GUIDE_FIELDS.sql` en el SQL Editor de tu dashboard de Supabase. Esto creará:

- Campos en la tabla `orders`:
  - `guia_number` - Número de guía de Servientrega
  - `guia_pdf_url` - URL del PDF de la guía
  - `guia_created_at` - Fecha de creación
  - `guia_created_by` - Admin que creó la guía

- Nueva tabla `servientrega_credentials`:
  - Almacena las credenciales y datos del remitente para Servientrega

### 2. Desplegar el Edge Function

El edge function ya está creado en: `supabase/functions/servientrega-generar-guia/index.ts`

Necesitas desplegarlo en tu proyecto de Supabase.

### 3. Configurar Credenciales de Servientrega

Inserta tus credenciales de Servientrega en la tabla `servientrega_credentials`:

```sql
INSERT INTO servientrega_credentials (
  username,
  password,
  nombre_remite,
  direccion_remite,
  distrito_remite,
  provincia_remite,
  telefono_remite,
  is_active
) VALUES (
  'tu_usuario_servientrega',
  'tu_password_servientrega',
  'Novedades Católicas',
  'Tu dirección completa',
  '24 DE DICIEMBRE',
  'PANAMA',
  'tu_teléfono',
  true
);
```

## Cómo Funciona

### Para el Admin:

1. **Ver Pedidos**: En el panel de administración, ve a la sección "Pedidos"

2. **Generar Guía**:
   - Cada pedido sin guía muestra el botón "Generar Guía Servientrega"
   - Al hacer clic, aparece un diálogo de confirmación
   - Se advierte que la guía es única y debe descargarse

3. **Confirmación**:
   - El admin confirma que desea generar la guía
   - El sistema llama al edge function de Servientrega
   - Se crea la guía y se abre automáticamente el PDF

4. **Después de Crear**:
   - El botón cambia a mostrar "✓ Guía Creada"
   - Muestra el número de guía y la fecha
   - Incluye un botón "Ver PDF" para abrir la guía
   - Opción de "Regenerar Guía" disponible

### Proceso Técnico:

1. El admin hace clic en "Generar Guía"
2. El frontend llama al edge function `servientrega-generar-guia`
3. El edge function:
   - Obtiene los detalles del pedido
   - Recupera las credenciales de Servientrega
   - Construye el request SOAP XML
   - Llama al API de Servientrega
   - Parsea la respuesta para obtener el número de guía y PDF URL
   - Actualiza el pedido en la base de datos
4. El frontend recibe la respuesta y:
   - Actualiza la UI
   - Abre el PDF en una nueva pestaña
   - Muestra mensaje de confirmación

## API de Servientrega

**Endpoint**: `http://ws-servientrega.appsiscore.com/generar_guia.php/getXML`

**Método**: POST (SOAP XML)

**Campos Importantes**:
- `nombre_destinatario` - Nombre del cliente del pedido
- `direccion_destinatario` - Dirección de envío
- `distrito_destinatario` - Distrito (corregimiento)
- `provincia_destinatario` - Provincia
- `telefono` - Teléfono del cliente
- `peso` - Peso del paquete (kg)
- `valor_declarado` - Valor total del pedido
- `remision` - Número de orden
- `usu` - Usuario de Servientrega
- `pwd` - Contraseña de Servientrega

## Seguridad

- Solo los usuarios admin pueden generar guías
- Las credenciales están protegidas con RLS
- El edge function valida la autenticación
- Las credenciales nunca se exponen al frontend

## Solución de Problemas

### Error: "Servientrega credentials not configured"
- Verifica que has insertado las credenciales en `servientrega_credentials`
- Asegúrate de que `is_active = true`

### Error: "Only admins can generate guides"
- Verifica que tu email está en la tabla `admin_users`

### La guía se genera pero no se abre el PDF
- Verifica que el API de Servientrega está devolviendo el campo PDF URL
- Revisa los logs del edge function en el dashboard de Supabase
