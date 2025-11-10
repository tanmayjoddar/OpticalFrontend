Spotify integration (client-side PKCE)
====================================

This project includes a client-side Spotify integration using the PKCE OAuth flow and the Web Playback SDK.

Setup
-----
1. Create an app on the Spotify Developer Dashboard: https://developer.spotify.com/dashboard
2. Add a Redirect URI that matches your dev URL (for example, http://localhost:5173/).
3. Add the following env variables to your local environment (see `.env.example`):

VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/

How it works
------------
- Click "Connect Spotify" in the header. This starts the PKCE flow and redirects to Spotify for user login.
- On redirect back, the app exchanges the code for tokens and initializes the Web Playback SDK.
- The header shows basic playback controls (Play/Pause/Next/Prev) and current track info.

Notes & limitations
-------------------
- Spotify Web Playback SDK requires the user to have a Spotify Premium account to play audio in the browser.
- The token exchange is performed client-side (PKCE). If you run into CORS or security concerns, consider a small server to handle token exchange and refresh.
- Tokens are stored in localStorage for convenience. You may want to secure storage depending on your threat model.
