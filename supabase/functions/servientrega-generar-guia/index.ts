import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateGuideRequest {
  orderId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .single();

    if (!adminCheck) {
      throw new Error('Only admins can generate guides');
    }

    const { orderId }: GenerateGuideRequest = await req.json();

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Get Servientrega credentials from environment
    const servientregaUsername = Deno.env.get('SERVIENTREGA_USUARIO');
    const servientregaPassword = Deno.env.get('SERVIENTREGA_CONTRASENA');

    if (!servientregaUsername || !servientregaPassword) {
      throw new Error('Servientrega credentials not configured');
    }

    // Get sender information from database
    const { data: credentials, error: credError } = await supabase
      .from('servientrega_credentials')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    // Use defaults if not in database
    const senderInfo = credentials || {
      nombre_remite: 'Novedades Católicas',
      direccion_remite: 'Panama',
      distrito_remite: '24 DE DICIEMBRE',
      provincia_remite: 'PANAMA',
      telefono_remite: ''
    };

    // Parse shipping address to get distrito and provincia from order
    // Format: "street houseNumber, corregimiento, distrito, provincia, Panama"
    const addressParts = order.shipping_address?.split(',').map((s: string) => s.trim()) || [];
    const provincia_destinatario = addressParts[3] || order.shipping_details?.provincia_des || 'PANAMA';
    const distrito_destinatario = addressParts[2] || order.shipping_details?.ciu_des || '';
    const direccion_destinatario = addressParts[0] || order.shipping_address || '';

    // Calculate total pieces (quantity of items)
    const totalPiezas = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    // Prepare item description
    const contiene = order.order_items
      .map((item: any) => `${item.quantity}x ${item.product_name}`)
      .join(', ')
      .substring(0, 100); // Limit length

    // Determine service type based on shipping details
    let servicio = 'SERVICIO AL DIA SIGUIENTE';
    if (order.shipping_details?.producto) {
      servicio = order.shipping_details.producto;
    }

    // Determine transport type
    let transporte = 'TERRESTRE';
    if (order.shipping_details?.transporte) {
      transporte = order.shipping_details.transporte;
    }

    // Build SOAP request
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <getXMLRequest xmlns="uri:http://ws-servientrega.appsiscore.com/server_wsi2.php">
      <nombre_destinatario>${order.customer_name}</nombre_destinatario>
      <direccion_destinatario>${direccion_destinatario}</direccion_destinatario>
      <distrito_destinatario>${distrito_destinatario}</distrito_destinatario>
      <provincia_destinatario>${provincia_destinatario}</provincia_destinatario>
      <nombre_remite>${senderInfo.nombre_remite}</nombre_remite>
      <direccion_remite>${senderInfo.direccion_remite}</direccion_remite>
      <distrito_remite>${senderInfo.distrito_remite}</distrito_remite>
      <provincia_remite>${senderInfo.provincia_remite}</provincia_remite>
      <servicio>${servicio}</servicio>
      <telefono>${order.customer_phone || senderInfo.telefono_remite}</telefono>
      <peso>${order.shipping_details?.peso || 5}</peso>
      <piezas>${totalPiezas}</piezas>
      <volumen></volumen>
      <contiene>${contiene}</contiene>
      <transporte></transporte>
      <valor_declarado>${order.total}</valor_declarado>
      <info01></info01>
      <valor_recaudar>0</valor_recaudar>
      <remision></remision>
      <factura></factura>
      <observacion></observacion>
      <guia_cliente></guia_cliente>
      <usu>${servientregaUsername}</usu>
      <pwd>${servientregaPassword}</pwd>
      <latitud></latitud>
      <longitud></longitud>
      <mail_destinatario>${order.customer_email}</mail_destinatario>
      <fecha_programacion></fecha_programacion>
    </getXMLRequest>
  </soap:Body>
</soap:Envelope>`;

    console.log('📦 Sending SOAP request to Servientrega...');
    console.log('📋 Order details:', {
      orderId,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      destinatario: {
        provincia: provincia_destinatario,
        distrito: distrito_destinatario,
        direccion: direccion_destinatario
      },
      remitente: {
        nombre: senderInfo.nombre_remite,
        provincia: senderInfo.provincia_remite,
        distrito: senderInfo.distrito_remite
      },
      servicio,
      transporte,
      peso: order.shipping_details?.peso || 5,
      piezas: totalPiezas
    });
    console.log('🔑 Using credentials:', {
      username: servientregaUsername,
      passwordLength: servientregaPassword?.length
    });

    // Call Servientrega SOAP API
    const servientregaResponse = await fetch(
      'http://ws-servientrega.appsiscore.com/generar_guia.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://ws-servientrega.appsiscore.com/generar_guia.php/getXML'
        },
        body: soapRequest
      }
    );

    const responseText = await servientregaResponse.text();
    console.log('📨 Servientrega response:', responseText);

    // Extract the <return> content from SOAP response
    const returnMatch = responseText.match(/<return[^>]*>([^<]+)<\/return>/i);
    if (!returnMatch) {
      throw new Error('Invalid SOAP response: <return> element not found');
    }

    // Decode HTML entities
    const decodedXml = returnMatch[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    console.log('📋 Decoded XML:', decodedXml);

    // Parse the inner XML to extract guia and autoscan URL
    const guiaMatch = decodedXml.match(/<guia>([^<]+)<\/guia>/i);
    const autoscanMatch = decodedXml.match(/<autoscan>([^<]+)<\/autoscan>/i);

    const guiaNumber = guiaMatch ? guiaMatch[1].trim() : null;
    const pdfUrl = autoscanMatch ? autoscanMatch[1].trim() : null;

    if (!guiaNumber) {
      // Check for error in response
      const errorMatch = decodedXml.match(/<error[^>]*>([^<]+)<\/error>/i) ||
                         decodedXml.match(/<mensaje[^>]*>([^<]+)<\/mensaje>/i);
      const errorMessage = errorMatch ? errorMatch[1] : 'Unknown error from Servientrega';
      throw new Error(`Servientrega error: ${errorMessage}`);
    }

    console.log('✅ Parsed guide data:', { guiaNumber, pdfUrl });

    // Update order with guide information
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        guia_number: guiaNumber,
        guia_pdf_url: pdfUrl,
        guia_created_at: new Date().toISOString(),
        guia_created_by: user.id,
        status: 'processing', // Update status to processing
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order with guide information');
    }

    console.log('✅ Guide generated successfully:', guiaNumber);

    return new Response(
      JSON.stringify({
        success: true,
        guiaNumber,
        pdfUrl,
        message: 'Guía generada exitosamente'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Error generating guide:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error al generar la guía'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
