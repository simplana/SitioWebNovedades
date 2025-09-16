export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { method, url, headers, body } = req.body;

    if (!method || !url) {
      return res.status(400).json({ error: 'Missing method or URL' });
    }

    console.log('🧪 Enhanced endpoint testing:', { method, url });

    const fetchOptions = {
      method,
      headers: {
        'User-Agent': 'Novedades-Catolicas-API-Tester/1.0',
        ...headers
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = body;
    }

    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - startTime;
    
    console.log('📡 Enhanced endpoint response:', response.status, response.statusText, `${responseTime}ms`);

    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Retornar la respuesta con información de estado
    res.status(200).json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced endpoint test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to test endpoint',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}