// API endpoint para intercambio de código por tokens (server-side simulation)
import express from 'express';

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

    const body = {
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LOYVERSE_REDIRECT_URI,
      client_id: process.env.LOYVERSE_CLIENT_ID ?? "dCcISKLUxosXUJvjIcSN",
      client_secret: process.env.LOYVERSE_CLIENT_SECRET
    };

    console.log('🔄 Exchanging code for tokens with Loyverse...');
    console.log('📋 Request body:', { ...body, client_secret: '[HIDDEN]' });

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
      console.error('❌ Token exchange failed:', text);
      throw new Error(text || "Token exchange failed");
    }

    const data = await resp.json();
    console.log('✅ Token exchange successful');
    
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