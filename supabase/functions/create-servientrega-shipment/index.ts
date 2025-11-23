import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const SERVIENTREGA_CREDENTIALS = {
  user: 'INTEGRACION',
  password: '81dc9bdb52d04dc20036dbd8313ed055',
  wsdl: 'https://sismilenio.secure.footprint.net:8443/axis/services/GuiaCertificado?wsdl'
};

interface ShipmentRequest {
  orderId: string;
  packageNumber: number;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  destinationAddress: string;
  destinationProvince: string;
  destinationDistrito?: string;
  destinationCorregimiento?: string;
  weightKg: number;
  declaredValue: number;
  shippingCost: number;
  shippingZone: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

function buildSoapEnvelope(data: ShipmentRequest, guiaNumber: string): string {
  const itemsDescription = data.items
    .map(item => `${item.name} (x${item.quantity})`)
    .join(', ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:GenerarGuia>
      <tem:objGuia>
        <tem:Nombre_Remitente>Novedades Catolicas</tem:Nombre_Remitente>
        <tem:Direccion_Remitente>Panama, Panama</tem:Direccion_Remitente>
        <tem:Telefono_Remitente>507-XXXXXXXX</tem:Telefono_Remitente>
        <tem:Nombre_Destinatario>${escapeXml(data.recipientName)}</tem:Nombre_Destinatario>
        <tem:Direccion_Destinatario>${escapeXml(data.destinationAddress)}</tem:Direccion_Destinatario>
        <tem:Telefono_Destinatario>${escapeXml(data.recipientPhone)}</tem:Telefono_Destinatario>
        <tem:Ciudad_Destino>${escapeXml(data.destinationProvince)}</tem:Ciudad_Destino>
        <tem:Peso>${data.weightKg}</tem:Peso>
        <tem:Valor_Declarado>${data.declaredValue}</tem:Valor_Declarado>
        <tem:Numero_Guia>${guiaNumber}</tem:Numero_Guia>
        <tem:Descripcion_Contenido>${escapeXml(itemsDescription)}</tem:Descripcion_Contenido>
        <tem:Usuario>${SERVIENTREGA_CREDENTIALS.user}</tem:Usuario>
        <tem:Clave>${SERVIENTREGA_CREDENTIALS.password}</tem:Clave>
      </tem:objGuia>
    </tem:GenerarGuia>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateGuiaNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `NC${timestamp}${random}`;
}

function parseSoapResponse(xmlText: string): {
  success: boolean;
  trackingNumber?: string;
  guiaNumber?: string;
  message?: string;
  error?: string;
} {
  try {
    const successMatch = xmlText.match(/<Resultado>(.*?)<\/Resultado>/i);
    const trackingMatch = xmlText.match(/<NumeroGuia>(.*?)<\/NumeroGuia>/i);
    const messageMatch = xmlText.match(/<Mensaje>(.*?)<\/Mensaje>/i);

    const success = successMatch?.[1]?.toLowerCase() === 'true' || successMatch?.[1] === '1';
    const trackingNumber = trackingMatch?.[1] || undefined;
    const message = messageMatch?.[1] || undefined;

    if (success && trackingNumber) {
      return {
        success: true,
        trackingNumber,
        guiaNumber: trackingNumber,
        message
      };
    } else {
      return {
        success: false,
        error: message || 'Error desconocido de Servientrega'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Error parsing SOAP response: ${error.message}`
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: ShipmentRequest = await req.json();

    if (!requestData.orderId || !requestData.recipientName || !requestData.destinationAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const guiaNumber = generateGuiaNumber();
    const soapEnvelope = buildSoapEnvelope(requestData, guiaNumber);

    console.log('Sending SOAP request to Servientrega...');

    const soapResponse = await fetch(SERVIENTREGA_CREDENTIALS.wsdl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://tempuri.org/GenerarGuia'
      },
      body: soapEnvelope
    });

    const responseText = await soapResponse.text();
    console.log('SOAP Response:', responseText);

    const parsedResponse = parseSoapResponse(responseText);

    if (!parsedResponse.success) {
      return new Response(
        JSON.stringify({ error: parsedResponse.error || 'Failed to create shipment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const estimatedDate = new Date();
    const hoursToAdd = requestData.shippingZone === 'urbano' ? 24 : 
                       requestData.shippingZone === 'nacional' ? 48 : 96;
    estimatedDate.setHours(estimatedDate.getHours() + hoursToAdd);

    const { data: shipment, error: insertError } = await supabaseClient
      .from('shipments')
      .insert({
        order_id: requestData.orderId,
        user_id: user.id,
        package_number: requestData.packageNumber || 1,
        tracking_number: parsedResponse.trackingNumber,
        guia_number: parsedResponse.guiaNumber,
        status: 'label_created',
        origin_address: 'Panama, Panama',
        destination_address: requestData.destinationAddress,
        destination_province: requestData.destinationProvince,
        destination_distrito: requestData.destinationDistrito,
        destination_corregimiento: requestData.destinationCorregimiento,
        recipient_name: requestData.recipientName,
        recipient_phone: requestData.recipientPhone,
        recipient_email: requestData.recipientEmail,
        weight_kg: requestData.weightKg,
        declared_value: requestData.declaredValue,
        shipping_cost: requestData.shippingCost,
        shipping_zone: requestData.shippingZone,
        estimated_delivery_date: estimatedDate.toISOString().split('T')[0],
        servientrega_response: {
          raw: responseText,
          parsed: parsedResponse
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting shipment:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save shipment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabaseClient
      .from('tracking_events')
      .insert({
        shipment_id: shipment.id,
        tracking_number: parsedResponse.trackingNumber,
        event_date: new Date().toISOString(),
        event_code: 'LABEL_CREATED',
        event_description: 'Guía de envío generada',
        location: 'Panama, Panama',
        observations: parsedResponse.message
      });

    return new Response(
      JSON.stringify({
        success: true,
        shipment,
        trackingNumber: parsedResponse.trackingNumber,
        guiaNumber: parsedResponse.guiaNumber
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating shipment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});