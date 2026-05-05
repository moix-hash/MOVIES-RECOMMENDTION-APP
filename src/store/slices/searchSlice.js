import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { moviesAPI } from '../../services/tmdbAPI';

export const searchMovies = createAsyncThunk(
  'search/movies',
  async ({ query, page = 1 }, { rejectWithValue }) => {
    try {
      const res = await moviesAPI.searchMovies(query, page);
      return { results: res.data.results, page };
    } catch (e) { return rejectWithValue(e.message); }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: { query: '', results: [], loading: false, page: 1, totalPages: 1 },
  reducers: {
    setQuery:    (state, { payload }) => { state.query = payload; },
    clearSearch: (state) => { state.query = ''; state.results = []; state.page = 1; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchMovies.pending,   (s) => { s.loading = true; })
      .addCase(searchMovies.rejected,  (s) => { s.loading = false; })
      .addCase(searchMovies.fulfilled, (s, { payload }) => {
        s.loading = false;
        const { results, page } = payload;
        s.results = page === 1 ? results : [...s.results, ...results];
        s.page = page;
      });
  },
});

export const { setQuery, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
