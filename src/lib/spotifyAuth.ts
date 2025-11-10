// Minimal PKCE helpers and token exchange for Spotify (client-side PKCE flow)
// Note: Set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_REDIRECT_URI in your environment.

const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com';

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateCodeVerifierAndChallenge() {
  const verifier = crypto.getRandomValues(new Uint8Array(64)).reduce((s, b) => s + ('0' + b.toString(16)).slice(-2), '');
  const enc = new TextEncoder();
  const data = enc.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = base64UrlEncode(digest);
  return { verifier, challenge };
}

export function buildAuthUrl({ clientId, redirectUri, scope, codeChallenge }: { clientId: string; redirectUri: string; scope: string; codeChallenge: string; }) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope,
  });
  return `${SPOTIFY_ACCOUNTS}/authorize?${params.toString()}`;
}

async function postForm(url: string, body: Record<string, string>) {
  const params = new URLSearchParams(body);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function exchangeCodeForToken({ code, codeVerifier, redirectUri, clientId }: { code: string; codeVerifier: string; redirectUri: string; clientId: string; }) {
  // PKCE token exchange
  const url = `${SPOTIFY_ACCOUNTS}/api/token`;
  const data = await postForm(url, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });
  return data; // { access_token, token_type, expires_in, refresh_token, scope }
}

export async function refreshAccessToken({ refreshToken, clientId }: { refreshToken: string; clientId: string; }) {
  const url = `${SPOTIFY_ACCOUNTS}/api/token`;
  const data = await postForm(url, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
  return data; // may include access_token and expires_in
}
