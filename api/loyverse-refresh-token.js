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
    const { refreshToken, clientId, clientSecret, tokenUrl } = req.body;

    if (!refreshToken || !clientId || !clientSecret || !tokenUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('🔄 Enhanced token refresh request:', {
      clientId,
      tokenUrl,
      hasRefreshToken: !!refreshToken,
      hasSecret: !!clientSecret
    });

    // Refrescar token de acceso
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Novedades-Catolicas-OAuth2/1.0'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    console.log('📡 Loyverse refresh response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Loyverse token refresh failed:', errorText);
      return res.status(tokenResponse.status).json({ 
        error: `Token refresh failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
        details: errorText
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Loyverse token refresh successful');

    // Retornar nuevos datos del token
    res.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken, // Usar nuevo o mantener actual
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });

  } catch (error) {
    console.error('❌ Enhanced token refresh error:', error);
    res.status(500).json({ 
      error: 'Internal server error during token refresh',
      message: error.message 
    });
  }
}