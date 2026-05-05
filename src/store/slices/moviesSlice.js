import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { moviesAPI } from '../../services/tmdbAPI';

// ── Async thunks ──────────────────────────────────────────────────
export const fetchTrending     = createAsyncThunk('movies/trending',     async (_, { rejectWithValue }) => { try { return (await moviesAPI.getTrending()).data.results; } catch (e) { return rejectWithValue(e.message); } });
// FIX: arg must be an object so dispatch() with no args doesn't send undefined and override the default
export const fetchPopular      = createAsyncThunk('movies/popular',      async ({ page = 1 } = {}, { rejectWithValue }) => { try { const r = await moviesAPI.getPopular(page); return { results: r.data.results, page }; } catch (e) { return rejectWithValue(e.message); } });
export const fetchTopRated     = createAsyncThunk('movies/topRated',     async (_, { rejectWithValue }) => { try { return (await moviesAPI.getTopRated()).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const fetchNowPlaying   = createAsyncThunk('movies/nowPlaying',   async (_, { rejectWithValue }) => { try { return (await moviesAPI.getNowPlaying()).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const fetchUpcoming     = createAsyncThunk('movies/upcoming',     async (_, { rejectWithValue }) => { try { return (await moviesAPI.getUpcoming()).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const fetchActionMovies = createAsyncThunk('movies/action',       async (_, { rejectWithValue }) => { try { return (await moviesAPI.getActionMovies()).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const fetchHorror       = createAsyncThunk('movies/horror',       async (_, { rejectWithValue }) => { try { return (await moviesAPI.getHorrorMovies()).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const fetchAnimated     = createAsyncThunk('movies/animated',     async (_, { rejectWithValue }) => { try { return (await moviesAPI.getAnimated()).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const fetchGenres       = createAsyncThunk('movies/genres',       async (_, { rejectWithValue }) => { try { return (await moviesAPI.getGenres()).data.genres; } catch (e) { return rejectWithValue(e.message); } });
export const fetchByGenre      = createAsyncThunk('movies/byGenre',      async ({ genreId, page = 1 }, { rejectWithValue }) => { try { return (await moviesAPI.getByGenre(genreId, page)).data.results; } catch (e) { return rejectWithValue(e.message); } });
export const fetchMovieDetails = createAsyncThunk('movies/details',      async (movieId, { rejectWithValue }) => { try { return (await moviesAPI.getMovieDetails(movieId)).data; } catch (e) { return rejectWithValue(e.message); } });

const moviesSlice = createSlice({
  name: 'movies',
  initialState: {
    trending:      [],
    popular:       [],
    topRated:      [],
    nowPlaying:    [],
    upcoming:      [],
    action:        [],
    horror:        [],
    animated:      [],
    byGenre:       [],
    genres:        [],
    selectedGenre: null,
    currentMovie:  null,
    loading:       false,
    detailLoading: false,
    error:         null,
    popularPage:   1,
  },
  reducers: {
    setSelectedGenre:  (state, { payload }) => { state.selectedGenre = payload; },
    clearCurrentMovie: (state)              => { state.currentMovie  = null;    },
    clearByGenre:      (state)              => { state.byGenre       = [];      },
  },
  extraReducers: (builder) => {
    const pending   = (state) => { state.loading = true; state.error = null; };
    const rejected  = (state, { payload }) => { state.loading = false; state.error = payload; };

    builder
      .addCase(fetchTrending.pending,     pending)
      .addCase(fetchTrending.rejected,    rejected)
      .addCase(fetchTrending.fulfilled,   (s, { payload }) => { s.loading = false; s.trending   = payload; })
      .addCase(fetchPopular.fulfilled,    (s, { payload }) => { const { results, page } = payload; s.popular = page === 1 ? results : [...s.popular, ...results]; s.popularPage = page; })
      .addCase(fetchTopRated.fulfilled,   (s, { payload }) => { s.topRated   = payload; })
      .addCase(fetchNowPlaying.fulfilled, (s, { payload }) => { s.nowPlaying = payload; })
      .addCase(fetchUpcoming.fulfilled,   (s, { payload }) => { s.upcoming   = payload; })
      .addCase(fetchActionMovies.fulfilled,(s, { payload }) => { s.action    = payload; })
      .addCase(fetchHorror.fulfilled,     (s, { payload }) => { s.horror     = payload; })
      .addCase(fetchAnimated.fulfilled,   (s, { payload }) => { s.animated   = payload; })
      .addCase(fetchByGenre.fulfilled,    (s, { payload }) => { s.byGenre    = payload; s.loading = false; })
      .addCase(fetchByGenre.pending,      pending)
      .addCase(fetchGenres.fulfilled,     (s, { payload }) => { s.genres = [{ id: null, name: 'All' }, ...payload]; })
      .addCase(fetchMovieDetails.pending, (s) => { s.detailLoading = true; })
      .addCase(fetchMovieDetails.fulfilled,(s, { payload }) => { s.detailLoading = false; s.currentMovie = payload; })
      .addCase(fetchMovieDetails.rejected,(s) => { s.detailLoading = false; });
  },
});

export const { setSelectedGenre, clearCurrentMovie, clearByGenre } = moviesSlice.actions;
export default moviesSlice.reducer;
