import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL, StaffAPI } from '../lib/api';


export type AuthType = 'staff' | 'shopAdmin' | 'retailer' | 'admin' | null;

interface AuthState {
  token: string | null;
  type: AuthType;
  user: unknown;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('jwt') || null,
  type: (() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        return JSON.parse(stored).type || null;
      } catch {
        return null;
      }
    }
    return null;
  })(),
  user: (() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        return JSON.parse(stored).user || null;
      } catch {
        return null;
      }
    }
    return null;
  })(),
  loading: false,
  error: null,
};


export const login = createAsyncThunk(
  'auth/login',
  async (
    { type, email, password }: { type: AuthType; email: string; password: string },
    { rejectWithValue }
  ) => {
    let url = '';
  if (type === 'staff') url = `${BASE_URL}/api/auth/login`;
  if (type === 'shopAdmin') url = `${BASE_URL}/shop-admin/auth/login`;
  if (type === 'retailer') url = `${BASE_URL}/retailer/auth/login`;
    
    try {
      const response = await axios.post(url, { email, password }, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(response.data);
      
      // Handle different response structures based on user type
      let user;
      if (type === 'staff') {
        // Staff API returns: { token, staffId, name, shopId, shopName }
        user = {
          id: response.data.staffId,
          name: response.data.name,
          shopId: response.data.shopId,
          shopName: response.data.shopName
        };
      } else if (type === 'shopAdmin') {
        user = response.data.shopAdmin || response.data;
      } else if (type === 'retailer') {
        user = response.data.retailer || response.data;
      }
      
      return { token: response.data.token, type, user };
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);

// Enhanced logout action that calls attendance API for staff users
export const logoutWithAttendance = createAsyncThunk(
  'auth/logoutWithAttendance',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    
    try {
      // If user is staff, call attendance logout API
      if (state.auth.type === 'staff' && state.auth.token) {
        await StaffAPI.attendance.logout();
      }
      return true;
    } catch (err) {
      // Even if API call fails, continue with logout
      console.warn('Attendance logout API failed:', err);
      return true;
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.type = null;
      state.user = null;
      localStorage.removeItem('jwt');
      localStorage.removeItem('userData');
    },
    tokenExp(state) {
      state.token = null;
      state.type = null;
      state.user = null;
      localStorage.removeItem('jwt');
      localStorage.removeItem('userData');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.type = action.payload.type;
        state.user = action.payload.user;
        localStorage.setItem('jwt', action.payload.token);
          // Store user data (excluding token) in localStorage
          localStorage.setItem('userData', JSON.stringify({
            type: action.payload.type,
            user: action.payload.user
          }));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutWithAttendance.fulfilled, (state) => {
        state.token = null;
        state.type = null;
        state.user = null;
        localStorage.removeItem('jwt');
        localStorage.removeItem('userData');
      });
  },
});

export const { logout, tokenExp } = authSlice.actions;
export default authSlice.reducer;
