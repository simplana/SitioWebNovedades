// API endpoint para refrescar tokens (server-side simulation)

export async function refreshAccessToken(refresh_token: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    if (!refresh_token) {
      throw new Error("Missing refresh_token");
    }

    const body = {
      grant_type: "refresh_token",
      refresh_token,
      client_id: import.meta.env.LOYVERSE_CLIENT_ID ?? "dCcISKLUxosXUJvjIcSN",
      client_secret: import.meta.env.LOYVERSE_CLIENT_SECRET
    };

    console.log('🔄 Refreshing access token with Loyverse...');

    const resp = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('❌ Token refresh failed:', text);
      throw new Error(text || "Refresh failed");
    }

    const data = await resp.json();
    console.log('✅ Token refresh successful');
    
    // Podría llegar un refresh_token nuevo
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh_token, // Usar el nuevo o mantener el actual
      expires_in: data.expires_in
    };
  } catch (e: any) {
    console.error('❌ Error in token refresh:', e);
    throw new Error(e?.message || "Token refresh error");
  }
}