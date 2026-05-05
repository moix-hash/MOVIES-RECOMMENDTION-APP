import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { searchMovies, setQuery, clearSearch } from '../store/slices/searchSlice';
import { SkeletonMovieCard } from '../components/SkeletonLoader';
import { COLORS, FONTS, SPACING, RADIUS, TMDB_IMAGE_BASE } from '../constants/theme';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 28,    name: 'Action',      icon: '⚡' },
  { id: 35,    name: 'Comedy',      icon: '😂' },
  { id: 18,    name: 'Drama',       icon: '🎭' },
  { id: 27,    name: 'Horror',      icon: '👻' },
  { id: 878,   name: 'Sci-Fi',      icon: '🚀' },
  { id: 10749, name: 'Romance',     icon: '💕' },
  { id: 16,    name: 'Animation',   icon: '🎨' },
  { id: 53,    name: 'Thriller',    icon: '🔪' },
  { id: 99,    name: 'Documentary', icon: '🎬' },
  { id: 12,    name: 'Adventure',   icon: '🗺️' },
];

export default function SearchScreen({ navigation }) {
  const dispatch = useDispatch();
  const { query, results = [], loading, error } = useSelector(s => s.search);
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);
  const [focused, setFocused] = useState(false);

  // FIX: Stable debounce — timer ref is always the same object, no stale-closure issue
  const debouncedSearch = useCallback((text) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      console.log('Searching for:', text);
      if (text.trim().length > 1) {
        dispatch(searchMovies({ query: text }))
          .unwrap()
          .catch(err => console.error('Search error:', err));
      }
      else dispatch(clearSearch());
    }, 380);
  }, [dispatch]);

  const handleChange = (text) => {
    dispatch(setQuery(text));
    debouncedSearch(text);
  };

  const handleCategory = (genreId, name) => {
    navigation.navigate('AllMovies', { type: name, genreId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Ionicons name="search-outline" size={18} color={focused ? COLORS.text : COLORS.muted} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Movies, actors, directors..."
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => dispatch(clearSearch())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Browse mode — no query */}
      {!query && (
        <FlatList
          data={CATEGORIES}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          ListHeaderComponent={<Text style={styles.browseTitle}>Browse by Genre</Text>}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.catCard, { marginRight: index % 2 === 0 ? SPACING.sm : 0 }]}
              onPress={() => handleCategory(item.id, item.name)}
              activeOpacity={0.8}
            >
              <Text style={styles.catIcon}>{item.icon}</Text>
              <Text style={styles.catName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Loading */}
      {loading && query.length > 0 && (
        <View style={styles.skeletonWrap}>
          {[1,2,3,4,5].map(i => (
            <View key={i} style={styles.skeletonRow}>
              <SkeletonMovieCard size="sm" />
              <View style={{ flex: 1, gap: 8, paddingLeft: 4 }}>
                {[0.8, 0.5, 0.35].map((w, j) => (
                  <View key={j} style={{ height: j === 0 ? 14 : 12, width: `${w * 100}%`, backgroundColor: COLORS.surfaceHigh, borderRadius: 6, opacity: 0.5 }} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* No results */}
      {!loading && query.length > 1 && results.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptySub}>Try a different title or actor name</Text>
        </View>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: SPACING.xl }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
              activeOpacity={0.75}
            >
              <Image
                source={item.poster_path
                  ? { uri: `${TMDB_IMAGE_BASE}${item.poster_path}` }
                  : require('../../assets/placeholder.png')}
                style={styles.thumb}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.resultYear}>{item.release_date?.slice(0, 4)}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={11} color={COLORS.gold} />
                  <Text style={styles.ratingText}> {item.vote_average?.toFixed(1)}</Text>
                </View>
                <Text style={styles.resultOverview} numberOfLines={2}>{item.overview}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.mutedLight} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.dark },
  header:          { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  title:           { fontFamily: FONTS.title, fontSize: 32, color: COLORS.text, letterSpacing: 1, marginBottom: SPACING.md },
  searchBar:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border },
  searchBarFocused:{ borderColor: 'rgba(255,255,255,0.2)' },
  input:           { flex: 1, fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text },

  browseTitle:     { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SPACING.md },
  grid:            { padding: SPACING.xl },
  catCard:         { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'flex-start' },
  catIcon:         { fontSize: 28, marginBottom: SPACING.sm },
  catName:         { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },

  skeletonWrap:    { paddingHorizontal: SPACING.xl },
  skeletonRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },

  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIcon:       { fontSize: 52, marginBottom: SPACING.md },
  emptyTitle:      { fontFamily: FONTS.semibold, fontSize: 17, color: COLORS.text, marginBottom: SPACING.sm },
  emptySub:        { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted },

  resultItem:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  thumb:           { width: 56, height: 80, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface, flexShrink: 0 },
  resultInfo:      { flex: 1 },
  resultTitle:     { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
  resultYear:      { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  ratingText:      { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.gold },
  resultOverview:  { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 4, lineHeight: 17 },
  separator:       { height: 1, backgroundColor: COLORS.surface },
});
