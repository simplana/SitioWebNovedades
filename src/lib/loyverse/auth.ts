// Helper de gestión de tokens de Loyverse en el cliente
import { refreshAccessToken } from '../../api/loyverse/refresh';

export function getStoredAccessToken(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem("lv_access_token")
    : null;
}

export function getStoredRefreshToken(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem("lv_refresh_token")
    : null;
}

export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;
  
  const exp = Number(localStorage.getItem("lv_access_token_exp") || 0);
  return Date.now() >= exp;
}

export function hasValidTokens(): boolean {
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  
  return !!(accessToken && refreshToken);
}

export async function getAccessToken(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("getAccessToken can only be called in browser environment");
  }

  const exp = Number(localStorage.getItem("lv_access_token_exp") || 0);
  const tok = localStorage.getItem("lv_access_token");
  
  // Si el token existe y no ha expirado, devolverlo
  if (tok && Date.now() < exp) {
    console.log('✅ Using cached access token:', tok.substring(0, 20) + '...');
    return tok;
  }

  console.log('🔄 Access token expired or missing, refreshing...');
  
  const refresh_token = localStorage.getItem("lv_refresh_token");
  if (!refresh_token) {
    throw new Error("No refresh token stored. Please re-authorize with Loyverse.");
  }

  try {
    const data = await refreshAccessToken(refresh_token);
    
    // Guardar nuevos tokens
    localStorage.setItem("lv_access_token", data.access_token);
    localStorage.setItem(
      "lv_access_token_exp",
      String(Date.now() + (data.expires_in - 30) * 1000)
    );
    
    // Actualizar refresh token si llegó uno nuevo
    if (data.refresh_token) {
      localStorage.setItem("lv_refresh_token", data.refresh_token);
    }
    
    console.log('✅ Access token refreshed successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ Failed to refresh access token:', error);
    
    // Limpiar tokens inválidos
    clearStoredTokens();
    
    throw new Error("Failed to refresh access token. Please re-authorize with Loyverse.");
  }
}

export function clearStoredTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("lv_access_token");
    localStorage.removeItem("lv_refresh_token");
    localStorage.removeItem("lv_access_token_exp");
    console.log('🧹 Loyverse tokens cleared from localStorage');
  }
}

export function getTokenExpirationTime(): Date | null {
  if (typeof window === "undefined") return null;
  
  const exp = Number(localStorage.getItem("lv_access_token_exp") || 0);
  return exp > 0 ? new Date(exp) : null;
}