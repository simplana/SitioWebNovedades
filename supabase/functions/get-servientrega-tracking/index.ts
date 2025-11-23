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

function buildTrackingSoapEnvelope(trackingNumber: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:ConsultarGuia>
      <tem:numeroGuia>${trackingNumber}</tem:numeroGuia>
      <tem:usuario>${SERVIENTREGA_CREDENTIALS.user}</tem:usuario>
      <tem:clave>${SERVIENTREGA_CREDENTIALS.password}</tem:clave>
    </tem:ConsultarGuia>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function parseTrackingResponse(xmlText: string): {
  success: boolean;
  events?: Array<{
    date: string;
    code: string;
    description: string;
    location?: string;
    responsible?: string;
    observations?: string;
  }>;
  currentStatus?: string;
  error?: string;
} {
  try {
    const events: Array<{
      date: string;
      code: string;
      description: string;
      location?: string;
      responsible?: string;
      observations?: string;
    }> = [];

    const eventMatches = xmlText.matchAll(/<Evento>(.*?)<\/Evento>/gs);

    for (const match of eventMatches) {
      const eventXml = match[1];
      const dateMatch = eventXml.match(/<Fecha>(.*?)<\/Fecha>/i);
      const codeMatch = eventXml.match(/<Codigo>(.*?)<\/Codigo>/i);
      const descMatch = eventXml.match(/<Descripcion>(.*?)<\/Descripcion>/i);
      const locationMatch = eventXml.match(/<Ubicacion>(.*?)<\/Ubicacion>/i);
      const responsibleMatch = eventXml.match(/<Responsable>(.*?)<\/Responsable>/i);
      const obsMatch = eventXml.match(/<Observaciones>(.*?)<\/Observaciones>/i);

      if (dateMatch && codeMatch && descMatch) {
        events.push({
          date: dateMatch[1],
          code: codeMatch[1],
          description: descMatch[1],
          location: locationMatch?.[1],
          responsible: responsibleMatch?.[1],
          observations: obsMatch?.[1]
        });
      }
    }

    if (events.length === 0) {
      const statusMatch = xmlText.match(/<Estado>(.*?)<\/Estado>/i);
      const messageMatch = xmlText.match(/<Mensaje>(.*?)<\/Mensaje>/i);

      if (statusMatch || messageMatch) {
        return {
          success: true,
          events: [{
            date: new Date().toISOString(),
            code: 'INFO',
            description: statusMatch?.[1] || messageMatch?.[1] || 'Guía registrada',
            location: 'Panama'
          }],
          currentStatus: statusMatch?.[1] || 'pending'
        };
      }

      return {
        success: false,
        error: 'No se encontraron eventos de tracking'
      };
    }

    const currentStatus = events[events.length - 1].description;

    return {
      success: true,
      events,
      currentStatus
    };
  } catch (error) {
    return {
      success: false,
      error: `Error parsing tracking response: ${error.message}`
    };
  }
}

function mapStatusToInternal(description: string): string {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('entregado') || lowerDesc.includes('delivered')) {
    return 'delivered';
  }
  if (lowerDesc.includes('reparto') || lowerDesc.includes('entrega')) {
    return 'out_for_delivery';
  }
  if (lowerDesc.includes('tránsito') || lowerDesc.includes('transito') || lowerDesc.includes('transit')) {
    return 'in_transit';
  }
  if (lowerDesc.includes('generado') || lowerDesc.includes('creado') || lowerDesc.includes('label')) {
    return 'label_created';
  }
  if (lowerDesc.includes('fallido') || lowerDesc.includes('failed') || lowerDesc.includes('devuelto')) {
    return 'failed';
  }

  return 'in_transit';
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

    const url = new URL(req.url);
    const trackingNumber = url.searchParams.get('trackingNumber');
    const shipmentId = url.searchParams.get('shipmentId');

    if (!trackingNumber && !shipmentId) {
      return new Response(
        JSON.stringify({ error: 'trackingNumber or shipmentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let finalTrackingNumber = trackingNumber;

    if (!finalTrackingNumber && shipmentId) {
      const { data: shipment } = await supabaseClient
        .from('shipments')
        .select('tracking_number')
        .eq('id', shipmentId)
        .single();

      if (shipment) {
        finalTrackingNumber = shipment.tracking_number;
      }
    }

    if (!finalTrackingNumber) {
      return new Response(
        JSON.stringify({ error: 'Tracking number not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const soapEnvelope = buildTrackingSoapEnvelope(finalTrackingNumber);

    console.log('Fetching tracking from Servientrega...');

    const soapResponse = await fetch(SERVIENTREGA_CREDENTIALS.wsdl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://tempuri.org/ConsultarGuia'
      },
      body: soapEnvelope
    });

    const responseText = await soapResponse.text();
    console.log('Tracking response:', responseText);

    const parsedResponse = parseTrackingResponse(responseText);

    if (!parsedResponse.success) {
      return new Response(
        JSON.stringify({ error: parsedResponse.error || 'Failed to get tracking' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shipmentId) {
      const { data: shipment } = await supabaseClient
        .from('shipments')
        .select('id')
        .eq('id', shipmentId)
        .single();

      if (shipment && parsedResponse.events) {
        for (const event of parsedResponse.events) {
          await supabaseClient
            .from('tracking_events')
            .upsert({
              shipment_id: shipment.id,
              tracking_number: finalTrackingNumber,
              event_date: event.date,
              event_code: event.code,
              event_description: event.description,
              location: event.location,
              responsible: event.responsible,
              observations: event.observations
            }, {
              onConflict: 'shipment_id,event_date,event_code'
            });
        }

        const latestEvent = parsedResponse.events[parsedResponse.events.length - 1];
        const newStatus = mapStatusToInternal(latestEvent.description);

        await supabaseClient
          .from('shipments')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
            ...(newStatus === 'delivered' ? { actual_delivery_date: new Date().toISOString().split('T')[0] } : {})
          })
          .eq('id', shipment.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        trackingNumber: finalTrackingNumber,
        currentStatus: parsedResponse.currentStatus,
        events: parsedResponse.events
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting tracking:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});