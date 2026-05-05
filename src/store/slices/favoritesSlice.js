import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toggleWatchlistItem, markAsWatched } from '../../services/firebase';

export const syncToggleFavorite = createAsyncThunk(
  'favorites/syncToggle',
  async ({ userId, movie, isCurrentlyFav }, { rejectWithValue }) => {
    try {
      if (userId) await toggleWatchlistItem(userId, movie, isCurrentlyFav);
      return { movie, isCurrentlyFav };
    } catch (e) { return rejectWithValue(e.message); }
  }
);

export const syncMarkWatched = createAsyncThunk(
  'favorites/markWatched',
  async ({ userId, movie }, { rejectWithValue }) => {
    try {
      if (userId) await markAsWatched(userId, movie);
      return movie;
    } catch (e) { return rejectWithValue(e.message); }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { items: [], watched: [], syncing: false },
  reducers: {
    setWatchlistFromCloud: (state, { payload }) => { state.items   = payload; },
    setWatchedFromCloud:   (state, { payload }) => { state.watched = payload; },
    toggleFavorite: (state, { payload }) => {
      const idx = state.items.findIndex(m => m.id === payload.id);
      if (idx >= 0) state.items.splice(idx, 1);
      else          state.items.push(payload);
    },
    addWatched: (state, { payload }) => {
      if (!state.watched.find(m => m.id === payload.id)) state.watched.push(payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncToggleFavorite.pending,   s => { s.syncing = true;  })
      .addCase(syncToggleFavorite.fulfilled, s => { s.syncing = false; })
      .addCase(syncToggleFavorite.rejected,  s => { s.syncing = false; })
      .addCase(syncMarkWatched.fulfilled, (s, { payload }) => {
        if (!s.watched.find(m => m.id === payload.id)) s.watched.push(payload);
      });
  },
});

export const { toggleFavorite, setWatchlistFromCloud, setWatchedFromCloud, addWatched } = favoritesSlice.actions;
export const selectIsFavorite = (movieId) => (state) => state.favorites.items.some(m => m.id === movieId);
export const selectIsWatched  = (movieId) => (state) => state.favorites.watched.some(m => m.id === movieId);
export default favoritesSlice.reducer;
