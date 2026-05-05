import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import MovieCard from '../components/MovieCard';
import { fetchByGenre } from '../store/slices/moviesSlice';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_W    = (width - SPACING.xl * 2 - SPACING.md * 2) / 3;

export default function AllMoviesScreen({ navigation, route }) {
  const { type, movies: passedMovies = [], genreId } = route.params || {};
  const [layout, setLayout] = useState('grid');
  const dispatch = useDispatch();
  const { byGenre, loading } = useSelector(s => s.movies);

  // FIX: If navigated from SearchScreen with a genreId but no movies, fetch them
  useEffect(() => {
    if (genreId && passedMovies.length === 0) {
      dispatch(fetchByGenre({ genreId }));
    }
  }, [genreId]);

  // Use passed movies if available, otherwise fall back to fetched byGenre
  const movies = passedMovies.length > 0 ? passedMovies : byGenre;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{type}</Text>
        <TouchableOpacity onPress={() => setLayout(l => l === 'grid' ? 'list' : 'grid')}>
          <Ionicons name={layout === 'grid' ? 'list-outline' : 'grid-outline'} size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {loading && movies.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.netflix} />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={item => String(item.id)}
          numColumns={layout === 'grid' ? 3 : 1}
          key={layout}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={layout === 'grid' ? styles.grid : styles.list}
          columnWrapperStyle={layout === 'grid' ? { gap: SPACING.md } : undefined}
          renderItem={({ item }) =>
            layout === 'grid'
              ? (
                <View style={{ width: CARD_W, marginBottom: SPACING.lg }}>
                  <MovieCard
                    movie={item}
                    size="sm"
                    onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
                  />
                </View>
              )
              : (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
                  activeOpacity={0.75}
                >
                  <View style={styles.listPosterWrap}>
                    <MovieCard movie={item} size="sm" onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })} />
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.listYear}>{item.release_date?.slice(0, 4)}</Text>
                    <View style={styles.listRating}>
                      <Ionicons name="star" size={12} color={COLORS.gold} />
                      <Text style={styles.listRatingText}> {item.vote_average?.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.listOverview} numberOfLines={3}>{item.overview}</Text>
                  </View>
                </TouchableOpacity>
              )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.dark },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, gap: SPACING.md },
  backBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  title:          { flex: 1, fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  loadingWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  grid:           { paddingHorizontal: SPACING.xl, paddingBottom: 80 },
  list:           { paddingHorizontal: SPACING.xl, paddingBottom: 80 },

  listItem:       { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  listPosterWrap: { flexShrink: 0 },
  listInfo:       { flex: 1, justifyContent: 'center' },
  listTitle:      { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
  listYear:       { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  listRating:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  listRatingText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.gold },
  listOverview:   { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 17 },
});
