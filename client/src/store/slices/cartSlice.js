import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const applyCart = (state, payload) => {
  state.items = payload?.items || payload?.cart || [];
  state.totalItems = payload?.totalItems ?? state.items.reduce((s, i) => s + i.quantity, 0);
  state.totalPrice = payload?.totalPrice ?? state.items.reduce((s, i) => s + i.price * i.quantity, 0);
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/cart/add', { productId, quantity });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/cart/update/${productId}`, { quantity });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
    }
  }
);

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (productId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/cart/remove/${productId}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
  }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.delete('/cart/clear');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
  }
});

const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        applyCart(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        applyCart(state, action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        applyCart(state, action.payload);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        applyCart(state, action.payload);
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalItems = 0;
        state.totalPrice = 0;
      });
  },
});

export const { clearError } = cartSlice.actions;
export default cartSlice.reducer;
