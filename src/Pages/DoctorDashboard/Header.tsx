import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/authSlice';
import { Menu, LogOut, User, Stethoscope, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useSpotify } from '@/components/spotify/SpotifyContext';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { DoctorAPI } from '@/lib/api';

interface HeaderProps { setSidebarOpen: (open: boolean) => void; }

export default function DoctorHeader({ setSidebarOpen }: HeaderProps) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [prescriptionCount, setPrescriptionCount] = useState<number>(0);
  const { isAuthenticated, login, logout: spotifyLogout, token, playerState } = useSpotify();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await DoctorAPI.prescriptions.list({ page: 1, limit: 1 });
        if (!cancelled) setPrescriptionCount(data.total ?? (data.prescriptions?.length || 0));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
          <div className="flex items-center space-x-2 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-brand-gradient flex items-center gap-2 truncate max-w-[10rem] xs:max-w-none">
              <Stethoscope className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Doctor Portal</span>
            </h1>
            {prescriptionCount > 0 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline md:inline">Rx: {prescriptionCount}</span>
            )}
          </div>
        </div>

  <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="text-sm mr-3 hidden md:block">
                  {playerState.track ? (
                    <span className="max-w-[260px] truncate">{playerState.track.name} — {(playerState.track.artists || []).join(', ')}</span>
                  ) : <span className="text-muted-foreground">Not playing</span>}
                </div>
                <Button variant="ghost" size="icon" onClick={async () => { if (!token?.access_token) return; await fetch('https://api.spotify.com/v1/me/player/previous', { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}` } }); }}><SkipBack className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={async () => { if (!token?.access_token) return; if (playerState.isPlaying) await fetch('https://api.spotify.com/v1/me/player/pause', { method: 'PUT', headers: { Authorization: `Bearer ${token.access_token}` } }); else { await fetch('https://api.spotify.com/v1/me/player/play', { method: 'PUT', headers: { Authorization: `Bearer ${token.access_token}` } }); } }}>
                  {playerState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={async () => { if (!token?.access_token) return; await fetch('https://api.spotify.com/v1/me/player/next', { method: 'POST', headers: { Authorization: `Bearer ${token.access_token}` } }); }}><SkipForward className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => spotifyLogout()}>Disconnect</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => login()}>Connect Spotify</Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full hover:text-primary">
                <Avatar className="h-9 w-9 md:h-10 md:w-10">
                  <AvatarFallback className="bg-app-gradient text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{(user as any)?.name || 'Doctor'}</p>
                  <p className="text-xs text-muted-foreground">{(user as any)?.email || ''}</p>
                </div>
              </div>
              <DropdownMenuItem onClick={() => dispatch(logout())}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
