import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, Linking, FlatList, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovieDetails, clearCurrentMovie } from '../store/slices/moviesSlice';
import { toggleFavorite, syncToggleFavorite, selectIsFavorite, syncMarkWatched } from '../store/slices/favoritesSlice';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, TMDB_IMAGE_BASE, TMDB_BACKDROP_ORIG, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 300;

export default function MovieDetailScreen({ navigation, route }) {
  const { movieId }  = route.params;
  const dispatch     = useDispatch();
  const { user }     = useAuth();
  const insets       = useSafeAreaInsets();
  const { currentMovie, detailLoading } = useSelector(s => s.movies);
  const isFav        = useSelector(selectIsFavorite(movieId));
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'cast' | 'similar'
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(fetchMovieDetails(movieId));
    return () => dispatch(clearCurrentMovie());
  }, [movieId]);

  const handleFav = useCallback(() => {
    if (!currentMovie) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const movieData = {
      id: currentMovie.id, title: currentMovie.title,
      poster_path: currentMovie.poster_path, vote_average: currentMovie.vote_average,
      release_date: currentMovie.release_date, genre_ids: currentMovie.genres?.map(g => g.id) || [],
    };
    dispatch(toggleFavorite(movieData));
    dispatch(syncToggleFavorite({ userId: user?.uid, movie: movieData, isCurrentlyFav: isFav }));
  }, [currentMovie, isFav, user]);

  const handleMarkWatched = useCallback(() => {
    if (!currentMovie) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(syncMarkWatched({ userId: user?.uid, movie: currentMovie }));
  }, [currentMovie, user]);

  if (detailLoading || !currentMovie) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.netflix} />
      </View>
    );
  }

  const movie   = currentMovie;
  const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const cast    = movie.credits?.cast?.slice(0, 15) || [];
  const similar = movie.similar?.results?.filter(m => m.poster_path).slice(0, 10) || [];
  const recs    = movie.recommendations?.results?.filter(m => m.poster_path).slice(0, 10) || [];
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';
  const score   = movie.vote_average?.toFixed(1);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, HEADER_HEIGHT],
    outputRange: [-50, 0, HEADER_HEIGHT * 0.5],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.8],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });
  
  const navBgOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT * 0.5, HEADER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      {/* Sticky Header Nav */}
      <Animated.View style={[styles.stickyNav, { height: insets.top + 60, opacity: navBgOpacity }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.stickyNavInner, { paddingTop: insets.top }]}>
          <Text style={styles.stickyNavTitle} numberOfLines={1}>{movie.title}</Text>
        </View>
      </Animated.View>

      {/* Top Controls (always visible, zIndex higher) */}
      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BlurView intensity={40} tint="dark" style={styles.iconBlur}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </BlurView>
        </TouchableOpacity>
        <View style={styles.topRight} pointerEvents="box-none">
          <TouchableOpacity style={styles.iconBtnSm} onPress={handleFav}>
            <BlurView intensity={40} tint="dark" style={styles.iconBlur}>
              <Ionicons name={isFav ? 'bookmark' : 'bookmark-outline'} size={20} color={isFav ? COLORS.netflix : '#fff'} />
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnSm}>
            <BlurView intensity={40} tint="dark" style={styles.iconBlur}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </BlurView>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        bounces={true}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Parallax Backdrop */}
        <Animated.View style={[styles.backdropWrap, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
          <Image
            source={{ uri: `${TMDB_BACKDROP_ORIG}${movie.backdrop_path}` }}
            style={styles.backdrop}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', '#000000']}
            locations={[0, 0.5, 1]}
            style={styles.backdropGradient}
          />

          {/* Play overlay */}
          {trailer && (
            <TouchableOpacity
              style={styles.playOverlay}
              onPress={() => Linking.openURL(`https://youtube.com/watch?v=${trailer.key}`)}
              activeOpacity={0.8}
            >
              <BlurView intensity={30} tint="light" style={styles.playCircle}>
                <Ionicons name="play" size={28} color="#fff" style={{ marginLeft: 4 }} />
              </BlurView>
              <Text style={styles.playLabel}>Watch Trailer</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Poster + title row */}
          <View style={styles.titleRow}>
            <View style={styles.posterContainer}>
              <Image
                source={{ uri: `${TMDB_IMAGE_BASE}${movie.poster_path}` }}
                style={styles.poster}
                contentFit="cover"
                transition={300}
              />
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.title} numberOfLines={3}>{movie.title}</Text>
              {movie.tagline ? <Text style={styles.tagline} numberOfLines={2}>"{movie.tagline}"</Text> : null}
              <View style={styles.metaRow}>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={12} color={COLORS.gold} />
                  <Text style={styles.ratingVal}> {score}</Text>
                </View>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{runtime}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{movie.release_date?.slice(0, 4)}</Text>
              </View>
              {/* Genres */}
              <View style={styles.genreRow}>
                {movie.genres?.slice(0, 3).map(g => (
                  <View key={g.id} style={styles.genrePill}>
                    <Text style={styles.genreText}>{g.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            {trailer && (
              <TouchableOpacity
                style={styles.trailerBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  Linking.openURL(`https://youtube.com/watch?v=${trailer.key}`);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#E50914', '#B20710']}
                  style={styles.trailerBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={styles.trailerBtnText}>Play Trailer</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtnContainer} onPress={handleFav} activeOpacity={0.7}>
               <BlurView intensity={20} tint="dark" style={[styles.actionBtn, isFav && styles.actionBtnActive]}>
                <Ionicons name={isFav ? 'bookmark' : 'bookmark-outline'} size={18} color={isFav ? COLORS.netflix : '#fff'} />
                <Text style={[styles.actionBtnText, isFav && { color: COLORS.netflix }]}>{isFav ? 'Saved' : 'Save'}</Text>
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnContainer} onPress={handleMarkWatched} activeOpacity={0.7}>
               <BlurView intensity={20} tint="dark" style={styles.actionBtn}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Watched</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Stats bar */}
          <View style={styles.statsBar}>
            {[
              { label: 'RATING',    val: `${score}/10` },
              { label: 'BUDGET',    val: movie.budget  > 0 ? `$${(movie.budget  / 1e6).toFixed(0)}M` : 'N/A' },
              { label: 'BOX OFFICE',val: movie.revenue > 0 ? `$${(movie.revenue / 1e6).toFixed(0)}M` : 'N/A' },
              { label: 'VOTES',     val: movie.vote_count > 999 ? `${(movie.vote_count / 1000).toFixed(1)}K` : String(movie.vote_count) },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 3 && styles.statDivider]}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {['about', 'cast', 'similar'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tabItem, activeTab === t && styles.tabItemActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(t);
                }}
              >
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab: About */}
          {activeTab === 'about' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionLabel}>SYNOPSIS</Text>
              <Text style={styles.overview}>{movie.overview}</Text>

              {movie.production_companies?.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>PRODUCTION</Text>
                  <Text style={styles.overview}>
                    {movie.production_companies.slice(0, 3).map(c => c.name).join(' · ')}
                  </Text>
                </>
              )}

              {movie.keywords?.keywords?.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>KEYWORDS</Text>
                  <View style={styles.keywords}>
                    {movie.keywords.keywords.slice(0, 10).map(k => (
                      <BlurView intensity={20} tint="light" key={k.id} style={styles.keyword}>
                        <Text style={styles.keywordText}>{k.name}</Text>
                      </BlurView>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Tab: Cast */}
          {activeTab === 'cast' && (
            <View style={styles.tabContent}>
              {cast.map(person => (
                <TouchableOpacity
                  key={person.id}
                  style={styles.castRow}
                  onPress={() => alert('PersonDetail coming soon')}
                  activeOpacity={0.75}
                >
                  <Image
                    source={person.profile_path
                      ? { uri: `${TMDB_IMAGE_BASE}${person.profile_path}` }
                      : require('../../assets/placeholder.png')}
                    style={styles.castAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.castInfo}>
                    <Text style={styles.castName}>{person.name}</Text>
                    <Text style={styles.castChar} numberOfLines={1}>{person.character}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.mutedLight} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tab: Similar */}
          {activeTab === 'similar' && (
            <View style={styles.tabContent}>
              {recs.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>RECOMMENDED</Text>
                  <FlatList
                    data={recs}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => String(item.id)}
                    style={{ marginBottom: SPACING.xl }}
                    renderItem={({ item }) => (
                      <View style={{ marginRight: 12 }}>
                        <View style={styles.simItem}>
                          <TouchableOpacity onPress={() => navigation.push('MovieDetail', { movieId: item.id })}>
                            <Image source={{ uri: `${TMDB_IMAGE_BASE}${item.poster_path}` }} style={styles.simPoster} contentFit="cover" transition={200} />
                          </TouchableOpacity>
                          <Text style={styles.simTitle} numberOfLines={1}>{item.title}</Text>
                        </View>
                      </View>
                    )}
                  />
                </>
              )}
              <Text style={styles.sectionLabel}>MORE LIKE THIS</Text>
              <FlatList
                data={similar}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                  <View style={{ marginRight: 12 }}>
                    <TouchableOpacity onPress={() => navigation.push('MovieDetail', { movieId: item.id })}>
                      <Image source={{ uri: `${TMDB_IMAGE_BASE}${item.poster_path}` }} style={styles.simPoster} contentFit="cover" transition={200} />
                    </TouchableOpacity>
                    <Text style={styles.simTitle} numberOfLines={1}>{item.title}</Text>
                  </View>
                )}
              />
            </View>
          )}

          <View style={{ height: 60 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#000' },
  loading:         { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },

  stickyNav:       { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, overflow: 'hidden' },
  stickyNavInner:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 60 },
  stickyNavTitle:  { fontFamily: FONTS.bold, fontSize: 16, color: '#fff', letterSpacing: 0.5 },

  backdropWrap:    { width, height: HEADER_HEIGHT, position: 'relative' },
  backdrop:        { width: '100%', height: '100%' },
  backdropGradient:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' },

  topBar:          { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, zIndex: 20 },
  backBtn:         { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  topRight:        { flexDirection: 'row', gap: SPACING.sm },
  iconBtnSm:       { width: 38, height: 38, borderRadius: 19, overflow: 'hidden' },
  iconBlur:        { flex: 1, alignItems: 'center', justifyContent: 'center' },

  playOverlay:     { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -50 }, { translateY: -20 }], alignItems: 'center' },
  playCircle:      { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' },
  playLabel:       { fontFamily: FONTS.semibold, fontSize: 12, color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3, letterSpacing: 0.5 },

  content:         { paddingTop: SPACING.sm, backgroundColor: '#000' },

  titleRow:        { flexDirection: 'row', gap: SPACING.lg, paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg, marginTop: -40 },
  posterContainer: { elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 10 },
  poster:          { width: 110, height: 165, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, flexShrink: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  titleInfo:       { flex: 1, justifyContent: 'flex-end', paddingTop: 40 },
  title:           { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text, lineHeight: 28, marginBottom: 4, letterSpacing: 0.5 },
  tagline:         { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.netflix, fontStyle: 'italic', marginBottom: SPACING.sm },
  metaRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  ratingPill:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  ratingVal:       { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.gold },
  metaDot:         { color: COLORS.mutedLight, fontSize: 12 },
  metaText:        { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.muted },
  genreRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  genrePill:       { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4 },
  genreText:       { fontFamily: FONTS.medium, fontSize: 10, color: '#fff', letterSpacing: 0.5 },

  actionRow:       { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  trailerBtn:      { flex: 2, borderRadius: RADIUS.md, overflow: 'hidden' },
  trailerBtnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  trailerBtnText:  { fontFamily: FONTS.bold, fontSize: 14, color: '#fff', letterSpacing: 0.5 },
  actionBtnContainer:{ flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  actionBtn:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionBtnActive: { borderColor: COLORS.netflix, backgroundColor: 'rgba(229,9,20,0.1)' },
  actionBtnText:   { fontFamily: FONTS.medium, fontSize: 11, color: '#fff' },

  statsBar:        { flexDirection: 'row', marginHorizontal: SPACING.xl, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: SPACING.xl },
  statItem:        { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  statDivider:     { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
  statVal:         { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },
  statLabel:       { fontFamily: FONTS.semibold, fontSize: 9, color: COLORS.muted, letterSpacing: 1.5, marginTop: 4 },

  tabs:            { flexDirection: 'row', paddingHorizontal: SPACING.xl, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: SPACING.lg },
  tabItem:         { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabItemActive:   { borderBottomColor: COLORS.netflix },
  tabText:         { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.muted },
  tabTextActive:   { color: '#fff' },

  tabContent:      { paddingHorizontal: SPACING.xl },
  sectionLabel:    { fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.muted, letterSpacing: 2, marginBottom: SPACING.sm },
  overview:        { fontFamily: FONTS.regular, fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 24 },
  keywords:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyword:         { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  keywordText:     { fontFamily: FONTS.medium, fontSize: 11, color: '#fff' },

  castRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: SPACING.md },
  castAvatar:      { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.surface },
  castInfo:        { flex: 1 },
  castName:        { fontFamily: FONTS.semibold, fontSize: 15, color: '#fff', letterSpacing: 0.3 },
  castChar:        { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 3 },

  simItem:         { width: 120 },
  simPoster:       { width: 120, height: 175, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  simTitle:        { fontFamily: FONTS.medium, fontSize: 12, color: 'rgba(255,255,255,0.9)', width: 120 },
});
