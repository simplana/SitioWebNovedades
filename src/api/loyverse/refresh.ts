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

    // Enviar la solicitud a nuestro propio servidor proxy
    const proxyResponse = await fetch("/api/loyverse/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ refresh_token })
    });

    if (!proxyResponse.ok) {
      const errorData = await proxyResponse.json();
      console.error('❌ Client: Token refresh failed via proxy:', errorData);
      throw new Error(errorData.error || "Token refresh failed via proxy");
    }

    const data = await proxyResponse.json();
    console.log('✅ Client: Token refresh successful via proxy');
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