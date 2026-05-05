import axios from 'axios';

// Get free API key from https://www.themoviedb.org/settings/api
// EXPO_PUBLIC_ prefix is required for Expo to expose env vars to the client bundle
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '9523a3afa8b84f4e7bb2e03b67de4ba4';
const BASE_URL = 'https://api.themoviedb.org/3';

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY, language: 'en-US' },
  timeout: 10000,
});

// Retry interceptor
tmdb.interceptors.response.use(null, async (error) => {
  if (error.config && !error.config._retry && error.response?.status >= 500) {
    error.config._retry = true;
    await new Promise(res => setTimeout(res, 1000));
    return tmdb(error.config);
  }
  return Promise.reject(error);
});

export const moviesAPI = {
  getTrending:     (timeWindow = 'week') => tmdb.get(`/trending/movie/${timeWindow}`),
  getPopular:      (page = 1)            => tmdb.get('/movie/popular',    { params: { page } }),
  getTopRated:     (page = 1)            => tmdb.get('/movie/top_rated',  { params: { page } }),
  getNowPlaying:   ()                    => tmdb.get('/movie/now_playing'),
  getUpcoming:     ()                    => tmdb.get('/movie/upcoming'),
  getActionMovies: (page = 1)            => tmdb.get('/discover/movie', { params: { with_genres: 28, sort_by: 'popularity.desc', page } }),
  getHorrorMovies: (page = 1)            => tmdb.get('/discover/movie', { params: { with_genres: 27, sort_by: 'popularity.desc', page } }),
  getRomanceMovies:(page = 1)            => tmdb.get('/discover/movie', { params: { with_genres: 10749, sort_by: 'popularity.desc', page } }),
  getAnimated:     (page = 1)            => tmdb.get('/discover/movie', { params: { with_genres: 16, sort_by: 'popularity.desc', page } }),
  getDocumentaries:(page = 1)            => tmdb.get('/discover/movie', { params: { with_genres: 99, sort_by: 'popularity.desc', page } }),

  getMovieDetails: (movieId) =>
    tmdb.get(`/movie/${movieId}`, {
      params: { append_to_response: 'credits,videos,similar,recommendations,images,keywords,reviews' },
    }),

  getPersonDetails: (personId) =>
    tmdb.get(`/person/${personId}`, {
      params: { append_to_response: 'movie_credits' },
    }),

  searchMovies:  (query, page = 1)        => tmdb.get('/search/movie',  { params: { query, page, include_adult: false } }),
  searchMulti:   (query, page = 1)        => tmdb.get('/search/multi',  { params: { query, page } }),
  getGenres:     ()                       => tmdb.get('/genre/movie/list'),
  getByGenre:    (genreId, page = 1)      => tmdb.get('/discover/movie', { params: { with_genres: genreId, sort_by: 'popularity.desc', page } }),
  getByYear:     (year, page = 1)         => tmdb.get('/discover/movie', { params: { primary_release_year: year, sort_by: 'vote_average.desc', vote_count_gte: 200, page } }),
};

export default tmdb;
