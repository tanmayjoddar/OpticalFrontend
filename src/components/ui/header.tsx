import { Button } from "./button";
import { useAuth } from "../../hooks/useAuth";
import { useSpotify } from '@/components/spotify/SpotifyContext';

function Header() {
  const { logout } = useAuth();
  const { isAuthenticated, login, logout: spotifyLogout, token, playerState } = useSpotify();

  const callApi = async (method: string, path: string, body?: any) => {
    if (!token?.access_token) return;
    const url = `https://api.spotify.com/v1${path}`;
    await fetch(url, { method, headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  };

  const togglePlay = async () => {
    if (!token?.access_token) return;
    if (playerState.isPlaying) {
      await callApi('PUT', '/me/player/pause');
    } else {
      // start playback on our device if deviceId available
      const body = playerState.deviceId ? { device_ids: [playerState.deviceId] } : undefined;
      if (body) {
        // transfer playback to web sdk device
        await callApi('PUT', '/me/player', body);
      }
      await callApi('PUT', '/me/player/play');
    }
  };

  const next = async () => { if (token?.access_token) await callApi('POST', '/me/player/next'); };
  const prev = async () => { if (token?.access_token) await callApi('POST', '/me/player/previous'); };

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 border-b z-50">
      <div className="flex items-center w-full h-full px-4">
        <Button variant="ghost" onClick={logout} className="mr-3 clay-button">Logout</Button>
        <span className="text-lg font-bold text-brand-gradient mr-4">Staff Dashboard</span>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="text-sm mr-3">
                {playerState.track ? (
                  <span className="max-w-[260px] truncate">{playerState.track.name} — {(playerState.track.artists || []).join(', ')}</span>
                ) : <span className="text-muted-foreground">Not playing</span>}
              </div>
              <Button size="sm" variant="outline" onClick={prev}>Prev</Button>
              <Button size="sm" onClick={togglePlay}>{playerState.isPlaying ? 'Pause' : 'Play'}</Button>
              <Button size="sm" variant="outline" onClick={next}>Next</Button>
              <Button size="sm" variant="ghost" onClick={spotifyLogout}>Disconnect</Button>
            </>
          ) : (
            <Button size="sm" onClick={login}>Connect Spotify</Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
