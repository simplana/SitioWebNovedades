/**
 * Shared Loyverse helpers.
 *
 * Extracted from loyverse-get-items so the token load/refresh logic lives in one
 * place instead of being copy-pasted into every function that talks to Loyverse.
 */

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const LOYVERSE_API = "https://api.loyverse.com/v1.0";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";

export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export class LoyverseAuthError extends Error {}

/**
 * Returns a usable Loyverse access token, refreshing it first when it is within
 * 24h of expiry. Throws LoyverseAuthError when no connection is configured.
 */
export async function getLoyverseToken(supabase: SupabaseClient): Promise<string> {
  const { data: credentials, error } = await supabase
    .from("loyverse_credentials")
    .select("access_token, refresh_token, token_expiry, id")
    .eq("is_active", true)
    .single();

  if (error || !credentials) {
    throw new LoyverseAuthError(
      "No Loyverse connection found. Please connect in Admin panel.",
    );
  }

  const hoursUntilExpiry =
    (new Date(credentials.token_expiry).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilExpiry >= 24) {
    return credentials.access_token;
  }

  const clientId = Deno.env.get("LOYVERSE_CLIENT_ID");
  const clientSecret = Deno.env.get("LOYVERSE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    // Nothing we can do about the refresh, but the current token may still work.
    console.error("Loyverse OAuth credentials not configured; using existing token");
    return credentials.access_token;
  }

  const form = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: credentials.refresh_token,
  });

  const refreshResponse = await fetch("https://api.loyverse.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form.toString(),
  });

  if (!refreshResponse.ok) {
    // Best effort: keep going with the old token, it may have hours left.
    console.error("Token refresh failed:", await refreshResponse.text());
    return credentials.access_token;
  }

  const tokenData = await refreshResponse.json();
  const newExpiry = new Date(Date.now() + (tokenData.expires_in - 30) * 1000);

  await supabase
    .from("loyverse_credentials")
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || credentials.refresh_token,
      token_expiry: newExpiry.toISOString(),
      last_refreshed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", credentials.id);

  console.log("Loyverse token refreshed");
  return tokenData.access_token;
}

/**
 * GET a Loyverse endpoint. Params go through URLSearchParams so that cursors --
 * which are base64 and routinely contain '+' and '=' -- survive the round trip.
 * Concatenating them raw corrupts the cursor and breaks pagination.
 */
export async function loyverseGet(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<any> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${LOYVERSE_API}/${path}?${query}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      throw new LoyverseAuthError("Authentication failed. Please reconnect in Admin panel.");
    }
    throw new Error(`Loyverse ${path} returned ${response.status}: ${body}`);
  }

  return await response.json();
}

/**
 * Walks every cursor page of a Loyverse list endpoint.
 * `maxPages` is a runaway guard, not an expected limit.
 */
export async function loyverseGetAll(
  path: string,
  collection: string,
  token: string,
  { limit = 250, maxPages = 40 }: { limit?: number; maxPages?: number } = {},
): Promise<any[]> {
  const all: any[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params: Record<string, string> = { limit: String(limit) };
    if (cursor) params.cursor = cursor;

    const data = await loyverseGet(path, params, token);
    const rows = data[collection] || [];
    all.push(...rows);

    cursor = data.cursor || undefined;
    if (!cursor || rows.length === 0) break;
  }

  return all;
}

/**
 * Normalises text for searching: lowercase and accents stripped, so that a
 * customer typing "rosario" matches "Rosário". The sync writes search_text
 * through this, and the client runs the query term through the same function.
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
