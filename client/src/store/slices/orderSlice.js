import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createOrder = createAsyncThunk('order/create', async (orderData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/orders', orderData);
    return data.order;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create order');
  }
});

export const fetchOrders = createAsyncThunk('order/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/orders');
    return data.orders || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchOrderById = createAsyncThunk('order/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data.order;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
  }
});

export const cancelOrder = createAsyncThunk('order/cancel', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/orders/${id}/cancel`, { reason });
    return data.order;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
  }
});

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        state.orders = state.orders.map((o) => (o._id === action.payload._id ? action.payload : o));
      });
  },
});

export const { clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
