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
    const { code, clientId, clientSecret, tokenUrl, redirectUri } = req.body;

    if (!code || !clientId || !clientSecret || !tokenUrl || !redirectUri) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('🔄 Token exchange request:', {
      clientId,
      tokenUrl,
      redirectUri,
      hasCode: !!code,
      hasSecret: !!clientSecret
    });

    // Exchange authorization code for access token
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    });

    console.log('📡 Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      return res.status(tokenResponse.status).json({ 
        error: `Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
        details: errorText
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Return token data (without logging sensitive information)
    res.status(200).json(tokenData);

  } catch (error) {
    console.error('❌ Token exchange error:', error);
    res.status(500).json({ 
      error: 'Internal server error during token exchange',
      message: error.message 
    });
  }
}