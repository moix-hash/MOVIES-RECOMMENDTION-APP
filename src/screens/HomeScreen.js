import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, FlatList, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchTrending, fetchPopular, fetchTopRated, fetchNowPlaying,
  fetchUpcoming, fetchActionMovies, fetchHorror, fetchAnimated,
  fetchGenres, setSelectedGenre, fetchByGenre, clearByGenre,
} from '../store/slices/moviesSlice';
import MovieCard from '../components/MovieCard';
import HeroCard from '../components/HeroCard';
import GenreChip from '../components/GenreChip';
import { SkeletonMovieCard, SkeletonHero } from '../components/SkeletonLoader';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

// ─── Section row component ────────────────────────────────────────
function MovieRow({ title, data, navigation, loading, badge, cardSize }) {
  if (loading) {
    return (
      <View style={{ marginBottom: SPACING.xxl }}>
        <View style={row.header}>
          <Text style={row.title}>{title}</Text>
        </View>
        <FlatList
          data={[1,2,3,4,5]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.xl }}
          keyExtractor={i => String(i)}
          renderItem={() => <SkeletonMovieCard size={cardSize} />}
        />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: SPACING.xxl }}>
      <View style={row.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Text style={row.title}>{title}</Text>
          {badge && <View style={row.badge}><Text style={row.badgeText}>{badge}</Text></View>}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('AllMovies', { type: title, movies: data })}>
          <Text style={row.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl }}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View style={{ marginRight: 12 }}>
            <MovieCard
              movie={item}
              size={cardSize}
              onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
            />
          </View>
        )}
      />
    </View>
  );
}

const row = StyleSheet.create({
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },
  title:     { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
  seeAll:    { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.muted },
  badge:     { backgroundColor: COLORS.netflix, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: FONTS.bold, fontSize: 9, color: '#fff', letterSpacing: 0.5 },
});

// ─── Main HomeScreen ───────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { trending, popular, topRated, nowPlaying, upcoming, action, horror, animated, genres, selectedGenre, byGenre, loading } = useSelector(s => s.movies);

  const scrollY      = useRef(new Animated.Value(0)).current;
  const [heroIdx, setHeroIdx]   = useState(0);
  const heroTimer    = useRef(null);

  useEffect(() => {
    dispatch(fetchTrending());
    dispatch(fetchPopular());
    dispatch(fetchTopRated());
    dispatch(fetchNowPlaying());
    dispatch(fetchUpcoming());
    dispatch(fetchActionMovies());
    dispatch(fetchHorror());
    dispatch(fetchAnimated());
    dispatch(fetchGenres());
  }, []);

  // Auto-rotate hero
  useEffect(() => {
    if (trending.length < 2) return;
    heroTimer.current = setInterval(() => {
      setHeroIdx(i => (i + 1) % Math.min(5, trending.length));
    }, 6000);
    return () => clearInterval(heroTimer.current);
  }, [trending]);

  // Genre filter
  useEffect(() => {
    if (selectedGenre) {
      dispatch(fetchByGenre({ genreId: selectedGenre }));
    } else {
      dispatch(clearByGenre());
    }
  }, [selectedGenre]);

  // Navbar blur on scroll
  const navBg = scrollY.interpolate({
    inputRange:  [0, 80],
    outputRange: ['rgba(10,10,10,0)', 'rgba(10,10,10,0.97)'],
    extrapolate: 'clamp',
  });

  const heroMovie = trending[heroIdx];

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        bounces
      >
        {/* Hero */}
        {loading && !heroMovie
          ? <SkeletonHero />
          : heroMovie && (
            <HeroCard
              movie={heroMovie}
              onPress={() => navigation.navigate('MovieDetail', { movieId: heroMovie.id })}
            />
          )
        }

        {/* Hero dot indicators */}
        {trending.length > 1 && (
          <View style={styles.dots}>
            {trending.slice(0, 5).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setHeroIdx(i)}>
                <View style={[styles.dot, heroIdx === i && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Genre filter row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.genreRow}
          contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm }}
        >
          {genres.map(g => (
            <GenreChip
              key={g.id ?? 'all'}
              label={g.name}
              active={selectedGenre === g.id}
              onPress={() => dispatch(setSelectedGenre(selectedGenre === g.id ? null : g.id))}
            />
          ))}
        </ScrollView>

        {/* Genre results */}
        {selectedGenre && byGenre.length > 0 && (
          <MovieRow
            title={genres.find(g => g.id === selectedGenre)?.name || 'Genre'}
            data={byGenre}
            navigation={navigation}
            loading={loading}
            badge="FILTERED"
          />
        )}

        {/* Main rows */}
        {!selectedGenre && <>
          <MovieRow title="Now Playing"      data={nowPlaying} navigation={navigation} loading={loading} badge="IN CINEMAS" />
          <MovieRow title="Popular This Week" data={popular}    navigation={navigation} loading={loading} />
          <MovieRow title="Top Rated All Time" data={topRated}  navigation={navigation} loading={loading} cardSize="lg" />
          <MovieRow title="Action & Adventure" data={action}    navigation={navigation} loading={loading} />
          <MovieRow title="Horror"             data={horror}    navigation={navigation} loading={loading} />
          <MovieRow title="Coming Up"          data={upcoming}  navigation={navigation} loading={loading} badge="SOON" />
          <MovieRow title="Animation"          data={animated}  navigation={navigation} loading={loading} />
        </>}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Floating nav bar */}
      <Animated.View style={[styles.navbar, { backgroundColor: navBg }]} pointerEvents="box-none">
        <SafeAreaView edges={['top']} pointerEvents="box-none">
          <View style={styles.navInner} pointerEvents="box-none">
            <Text style={styles.navLogo}>CINESCOPE</Text>
            <View style={styles.navRight} pointerEvents="box-none">
              <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search-outline" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={() => alert('Notifications coming soon')}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: COLORS.dark },
  scroll:    { flex: 1 },

  // Hero dots
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -SPACING.lg, marginBottom: SPACING.md, zIndex: 5 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 18, backgroundColor: COLORS.netflix },

  // Genre row
  genreRow:  { marginBottom: SPACING.md },

  // Floating navbar
  navbar:    { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  navInner:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  navLogo:   { fontFamily: FONTS.title, fontSize: 26, color: COLORS.netflix, letterSpacing: 4 },
  navRight:  { flexDirection: 'row', gap: SPACING.sm },
  navBtn:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
