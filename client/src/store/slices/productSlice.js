import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProducts = createAsyncThunk('product/fetchProducts', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

export const fetchProductById = createAsyncThunk('product/fetchProductById', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data.product || data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
  }
});

export const searchProducts = createAsyncThunk('product/searchProducts', async (searchTerm, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products/search', { params: { q: searchTerm } });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Search failed');
  }
});

export const addProductReview = createAsyncThunk(
  'product/addProductReview',
  async ({ productId, reviewData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/products/${productId}/reviews`, reviewData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add review');
    }
  }
);

export const fetchCategories = createAsyncThunk('product/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products/categories');
    return data.categories || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to load categories');
  }
});

const initialState = {
  products: [],
  currentProduct: null,
  categories: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  total: 0,
  filters: {
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sortBy: 'newest',
  },
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        minPrice: '',
        maxPrice: '',
        rating: '',
        sortBy: 'newest',
      };
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.totalPages = action.payload.totalPages || action.payload.pagination?.totalPages || 0;
        state.currentPage = action.payload.currentPage || action.payload.pagination?.currentPage || 1;
        state.total = action.payload.total || action.payload.pagination?.totalProducts || state.products.length;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.totalPages = action.payload.totalPages || 0;
        state.currentPage = action.payload.currentPage || 1;
      })
      .addCase(addProductReview.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.product) {
          state.currentProduct = action.payload.product;
        }
      })
      .addCase(addProductReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const { clearError, clearCurrentProduct, setFilters, clearFilters, setCurrentPage } = productSlice.actions;
export default productSlice.reducer;
