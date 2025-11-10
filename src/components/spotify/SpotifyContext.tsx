import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { generateCodeVerifierAndChallenge, buildAuthUrl, exchangeCodeForToken, refreshAccessToken } from '@/lib/spotifyAuth';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string;
const SCOPE = 'streaming user-read-playback-state user-modify-playback-state user-read-currently-playing';

type SpotifyToken = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // epoch ms
};

type PlayerState = {
  deviceId?: string;
  isPlaying?: boolean;
  track?: { name?: string; artists?: string[]; uri?: string; album?: { name?: string } } | null;
  position?: number;
};

type SpotifyContextValue = {
  token?: SpotifyToken | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  setToken: (t: SpotifyToken | null) => void;
  refreshToken: () => Promise<void>;
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
};

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export const useSpotify = () => {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error('useSpotify must be used within SpotifyProvider');
  return ctx;
};

const TOKEN_KEY = 'spotify_token_v1';
const PKCE_VERIFIER_KEY = 'spotify_pkce_verifier_v1';

export const SpotifyProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<SpotifyToken | null>(() => {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [playerState, setPlayerState] = useState<PlayerState>({});

  const isAuthenticated = !!token?.access_token;

  const setToken = useCallback((t: SpotifyToken | null) => {
    setTokenState(t);
    if (t) localStorage.setItem(TOKEN_KEY, JSON.stringify(t)); else localStorage.removeItem(TOKEN_KEY);
  }, []);

  const login = useCallback(async () => {
    if (!CLIENT_ID || !REDIRECT_URI) {
      console.warn('Missing VITE_SPOTIFY_CLIENT_ID or VITE_SPOTIFY_REDIRECT_URI');
      return;
    }
    const { verifier, challenge } = await generateCodeVerifierAndChallenge();
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    const url = buildAuthUrl({ clientId: CLIENT_ID, redirectUri: REDIRECT_URI, scope: SCOPE, codeChallenge: challenge });
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setPlayerState({});
    try { sessionStorage.removeItem(PKCE_VERIFIER_KEY); } catch {};
  }, [setToken]);

  const handleCallback = useCallback(async () => {
    // call this on the redirect/callback route to pick up ?code= and exchange
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    if (!verifier) { console.warn('PKCE verifier missing'); return; }
    try {
      const data = await exchangeCodeForToken({ code, codeVerifier: verifier, redirectUri: REDIRECT_URI, clientId: CLIENT_ID });
      const expiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
      const t: SpotifyToken = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: expiresAt };
      setToken(t);
      // clean up URL
      const u = new URL(window.location.href);
      u.search = '';
      window.history.replaceState({}, document.title, u.toString());
    } catch (e) {
      console.error('Failed to exchange token', e);
    }
  }, [setToken]);

  useEffect(() => { handleCallback(); /* run on mount to catch redirect */ }, [handleCallback]);

  const refreshToken = useCallback(async () => {
    if (!token?.refresh_token) return;
    try {
      const data = await refreshAccessToken({ refreshToken: token.refresh_token, clientId: CLIENT_ID });
      const expiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
      const newToken: SpotifyToken = { access_token: data.access_token, refresh_token: data.refresh_token || token.refresh_token, expires_at: expiresAt };
      setToken(newToken);
    } catch (e) {
      console.error('refresh token failed', e);
      setToken(null);
    }
  }, [token, setToken]);

  // auto-refresh if token is near expiry
  useEffect(() => {
    if (!token?.expires_at || !token.refresh_token) return;
    const ms = token.expires_at - Date.now() - (60 * 1000); // refresh 1m early
    if (ms <= 0) { refreshToken(); return; }
    const id = setTimeout(() => refreshToken(), ms);
    return () => clearTimeout(id);
  }, [token, refreshToken]);

  const value = useMemo(() => ({ token, isAuthenticated, login, logout, setToken, refreshToken, playerState, setPlayerState }), [token, isAuthenticated, login, logout, setToken, refreshToken, playerState]);

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
};

export default SpotifyContext;
