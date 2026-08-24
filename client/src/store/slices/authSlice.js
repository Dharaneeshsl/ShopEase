import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const pickUser = (data) => data?.user || data;

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Logout failed');
  } finally {
    localStorage.removeItem('token');
  }
  return true;
});

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const { data } = await api.get('/auth/me');
    return data;
  } catch (error) {
    localStorage.removeItem('token');
    return rejectWithValue(error.response?.data?.message || 'Failed to get user data');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/users/profile', profileData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
  }
});

export const addAddress = createAsyncThunk('auth/addAddress', async (address, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/users/addresses', address);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add address');
  }
});

export const updateAddress = createAsyncThunk(
  'auth/updateAddress',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/addresses/${id}`, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update address');
    }
  }
);

export const deleteAddress = createAsyncThunk('auth/deleteAddress', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/users/addresses/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete address');
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
  }
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/auth/reset-password/${token}`, { password });
      if (data.token) localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  message: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.message = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = pickUser(action.payload);
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = pickUser(action.payload);
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = pickUser(action.payload);
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = pickUser(action.payload);
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        if (state.user) state.user.addresses = action.payload.addresses;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        if (state.user) state.user.addresses = action.payload.addresses;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        if (state.user) state.user.addresses = action.payload.addresses;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.token) {
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.user = pickUser(action.payload);
        }
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
