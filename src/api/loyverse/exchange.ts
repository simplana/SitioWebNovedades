// API endpoint para intercambio de código por tokens (direct to Loyverse)

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    if (!code) {
      throw new Error("Missing code");
    }

    console.log('🚀 DIRECT TOKEN EXCHANGE WITH LOYVERSE:');
    console.log('📋 Code:', code);
    
    const clientId = 'na0tlm2Whq22j3jTPV_l';
    const clientSecret = 'G02r649qvTDIY2s31K3qE2OhAI_MjgvybotOPwhJgXVKi0KJCeeNJw====';
    const redirectUri = `${window.location.origin}/auth/loyverse/callback`;

    // Usar application/x-www-form-urlencoded según documentación
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    console.log('📋 Form data:', formData.toString());

    const loyverseResponse = await fetch("https://api.loyverse.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: formData.toString()
    });

    console.log('📡 Loyverse response status:', loyverseResponse.status);

    if (!loyverseResponse.ok) {
      const errorText = await loyverseResponse.text();
      console.error('❌ Loyverse token exchange failed:', errorText);
      throw new Error(`Loyverse API error: ${loyverseResponse.status} - ${errorText}`);
    }

    const data = await loyverseResponse.json();
    console.log('✅ Token exchange successful with Loyverse!');
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in
    };
  } catch (e: any) {
    console.error('❌ Error in direct token exchange:', e);
    throw new Error(e?.message || "Token exchange error");
  }
}