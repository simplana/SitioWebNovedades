// Utilidad para construir URLs de autorización de Loyverse

export function buildAuthorizeUrl(state?: string): string {
  const base = "https://api.loyverse.com/oauth/authorize";
  const client_id = "dCcISKLUxosXUJvjIcSN";
  
  // Para desarrollo local con HTTPS
  const currentOrigin = typeof window !== 'undefined' 
    ? (window.location.protocol === 'https:' ? window.location.origin : 'https://localhost:5173')
    : 'https://localhost:5173';
    
  const redirect_uri = encodeURIComponent(
    `${currentOrigin}/auth/loyverse/callback`
  );
  
  // Scopes ya autorizados
  const scopes = [
    "ITEMS_READ",
    "INVENTORY_READ", 
    "CUSTOMERS_READ",
    "CUSTOMERS_WRITE",
    "RECEIPTS_WRITE",
    "RECEIPTS_READ",
    "OPENID"
  ];
  
  const scope = scopes.join("%20");
  const stateParam = state || `state_${Date.now()}`;
  
  const url = `${base}?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${stateParam}`;
  
  console.log('🔗 Generated Loyverse authorize URL:', url);
  return url;
}

export function getLoyverseApiBaseUrl(): string {
  return "https://api.loyverse.com/v1.0";
}

export function buildApiUrl(endpoint: string): string {
  const baseUrl = getLoyverseApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
}