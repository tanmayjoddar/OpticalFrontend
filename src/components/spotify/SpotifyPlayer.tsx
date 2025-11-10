import React, { useEffect, useRef } from 'react';
import { useSpotify } from './SpotifyContext';

declare global {
  interface Window { Spotify?: any; }
}

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js';

export const SpotifyPlayer: React.FC = () => {
  const { token, setPlayerState } = useSpotify();
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!token?.access_token) return;

    const addScript = () => {
      if ((window as any).Spotify) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        const el = document.createElement('script');
        el.src = SDK_URL;
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error('Failed to load Spotify SDK'));
        document.body.appendChild(el);
      });
    };

    let player: any = null;

    addScript().then(() => {
      const Spotify = (window as any).Spotify;
      if (!Spotify || !token?.access_token) return;
      // create player
      player = new Spotify.Player({
        name: 'OpticalFrontend Player',
        getOAuthToken: (cb: (t: string) => void) => { cb(token.access_token); },
      });
      playerRef.current = player;

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setPlayerState(prev => ({ ...prev, deviceId: device_id }));
      });

      player.addListener('not_ready', () => {
        setPlayerState(prev => ({ ...prev, deviceId: undefined }));
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        const track = state?.track_window?.current_track;
        setPlayerState({
          isPlaying: !state.paused,
          track: track ? { name: track.name, artists: track.artists.map((a:any) => a.name), uri: track.uri, album: { name: track.album.name } } : null,
          position: state.position,
        });
      });

      player.connect();
    }).catch(e => console.error(e));

    return () => { if (player) player.disconnect(); if (playerRef.current) playerRef.current = null; };
  }, [token, setPlayerState]);

  return null; // player runs in background; UI is provided by header controls
};

export default SpotifyPlayer;
