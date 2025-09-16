export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const accessToken = authHeader.substring(7);
    const { limit = 50, cursor } = req.query;

    let url = `https://api.loyverse.com/v1.0/items?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    console.log('🛍️ Fetching Loyverse items:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Loyverse-OAuth2-Tester/1.0'
      }
    });

    console.log('📡 Loyverse items response:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `Loyverse API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Loyverse items error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch items from Loyverse',
      message: error.message 
    });
  }
}