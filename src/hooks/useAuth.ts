import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { logout, logoutWithAttendance } from '../store/authSlice';

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  type BasicUser = { name?: string; email?: string; shopId?: number; shop?: { id?: number } } | null;
  const user = (auth.user as BasicUser) ?? null;
  
  const handleLogout = () => {
    if (auth.type === 'staff') {
      // For staff users, call attendance logout API first
      dispatch(logoutWithAttendance());
    } else {
      // For other user types, just clear state
      dispatch(logout());
    }
  };
  
  return {
    user,
    token: auth.token,
    type: auth.type,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: !!auth.token,
    isStaff: auth.type === 'staff',
    shopId: user?.shopId ?? user?.shop?.id,
    logout: handleLogout,
  };
};