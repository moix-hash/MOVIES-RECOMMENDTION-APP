import { configureStore } from '@reduxjs/toolkit';
import moviesReducer    from './slices/moviesSlice';
import favoritesReducer from './slices/favoritesSlice';
import searchReducer    from './slices/searchSlice';

export const store = configureStore({
  reducer: {
    movies:    moviesReducer,
    favorites: favoritesReducer,
    search:    searchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
