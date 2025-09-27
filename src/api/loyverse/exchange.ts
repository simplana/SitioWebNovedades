// API endpoint para intercambio de código por tokens (server-side simulation)
export const runtime = "nodejs";

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    if (!code) {
      throw new Error("Missing code");
    }

    // Enviar la solicitud a nuestro propio servidor proxy
    const proxyResponse = await fetch("/api/loyverse/exchange-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
      code,
      redirect_uri: import.meta.env.VITE_LOYVERSE_REDIRECT_URL
      })
    });

    if (!proxyResponse.ok) {
      const errorData = await proxyResponse.json();
      console.error('❌ Client: Token exchange failed via proxy:', errorData);
      throw new Error(errorData.error || "Token exchange failed via proxy");
    }

    const data = await proxyResponse.json();
    console.log('✅ Client: Token exchange successful via proxy');
    
    // Devuelve solo lo necesario al cliente
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in
    };
  } catch (e: any) {
    console.error('❌ Error in token exchange:', e);
    throw new Error(e?.message || "Token exchange error");
  }
}