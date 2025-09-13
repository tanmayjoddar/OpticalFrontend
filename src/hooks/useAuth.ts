import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.auth);
  
  return {
    user: auth.user,
    token: auth.token,
    type: auth.type,
    isAuthenticated: !!auth.token,
    isStaff: auth.type === 'staff',
    shopId: auth.user?.shopId || auth.user?.shop?.id,
  };
};