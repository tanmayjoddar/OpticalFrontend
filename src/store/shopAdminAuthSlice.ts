import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface Shop {
  id: number;
  name: string;
  address: string;
  phone: string;
}

interface ShopAdmin {
  id: number;
  name: string;
  email: string;
  shop: Shop;
}

interface ShopAdminAuthState {
  token: string | null;
  shopAdmin: ShopAdmin | null;
  loading: boolean;
  error: string | null;
}

const initialState: ShopAdminAuthState = {
  token: localStorage.getItem('shopAdminJwt') || null,
  shopAdmin: null,
  loading: false,
  error: null,
};

export const shopAdminLogin = createAsyncThunk(
  'shopAdminAuth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post('/api/shop-admin/auth/login', { email, password }, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

const shopAdminAuthSlice = createSlice({
  name: 'shopAdminAuth',
  initialState,
  reducers: {
    shopAdminLogout(state) {
      state.token = null;
      state.shopAdmin = null;
      localStorage.removeItem('shopAdminJwt');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(shopAdminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shopAdminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.shopAdmin = action.payload.shopAdmin;
        localStorage.setItem('shopAdminJwt', action.payload.token);
      })
      .addCase(shopAdminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { shopAdminLogout } = shopAdminAuthSlice.actions;
export default shopAdminAuthSlice.reducer;
