import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite, syncToggleFavorite, selectIsFavorite } from '../store/slices/favoritesSlice';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, TMDB_BACKDROP_ORIG, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function HeroCard({ movie, onPress }) {
  const dispatch   = useDispatch();
  const { user }   = useAuth();
  const isFav      = useSelector(selectIsFavorite(movie.id));
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [movie.id]);

  const handleFav = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const movieData = {
      id: movie.id, title: movie.title,
      poster_path: movie.poster_path, vote_average: movie.vote_average,
      release_date: movie.release_date, genre_ids: movie.genre_ids || [],
    };
    dispatch(toggleFavorite(movieData));
    dispatch(syncToggleFavorite({ userId: user?.uid, movie: movieData, isCurrentlyFav: isFav }));
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  const year    = movie.release_date?.slice(0, 4);
  const rating  = movie.vote_average?.toFixed(1);

  return (
    <View style={styles.container}>
      {/* Full-bleed backdrop */}
      <Image
        source={{ uri: `${TMDB_BACKDROP_ORIG}${movie.backdrop_path}` }}
        style={styles.backdrop}
        contentFit="cover"
        transition={500}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />

      {/* Multi-stop gradient for cinema feel */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.75)', '#000']}
        locations={[0, 0.4, 0.75, 1]}
        style={styles.gradient}
      />

      {/* Content */}
      <Animated.View style={[styles.info, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Meta badges */}
        <View style={styles.badgeRow}>
          <BlurView intensity={30} tint="dark" style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color={COLORS.gold} />
            <Text style={styles.ratingText}> {rating}</Text>
          </BlurView>
          {year && (
            <BlurView intensity={30} tint="dark" style={styles.yearBadge}>
              <Text style={styles.yearText}>{year}</Text>
            </BlurView>
          )}
          <BlurView intensity={30} tint="dark" style={styles.trendBadge}>
            <Text style={styles.trendText}>🔥 TRENDING</Text>
          </BlurView>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{movie.title.toUpperCase()}</Text>

        {/* Overview snippet */}
        <Text style={styles.overview} numberOfLines={2}>{movie.overview}</Text>

        {/* CTA Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.playBtnContainer} onPress={handlePress} activeOpacity={0.85}>
             <LinearGradient
                colors={['#fff', '#e5e5e5']}
                style={styles.playBtn}
             >
              <Ionicons name="play" size={18} color="#000" />
              <Text style={styles.playText}>Play</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreBtnContainer} onPress={handlePress} activeOpacity={0.85}>
            <BlurView intensity={30} tint="light" style={styles.moreBtn}>
              <Ionicons name="information-circle-outline" size={20} color="#fff" />
              <Text style={styles.moreText}>Details</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleFav} activeOpacity={0.85}>
            <BlurView intensity={30} tint="light" style={styles.iconBtn}>
              <Ionicons
                name={isFav ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isFav ? COLORS.netflix : '#fff'}
              />
            </BlurView>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { width, height: 560, position: 'relative' },
  backdrop:    { position: 'absolute', width: '100%', height: '100%' },
  gradient:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' },
  info:        { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },

  badgeRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  ratingText:  { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.gold },
  yearBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  yearText:    { fontFamily: FONTS.medium, fontSize: 12, color: '#fff' },
  trendBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(229,9,20,0.3)' },
  trendText:   { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.netflix, letterSpacing: 0.5 },

  title:       { fontFamily: FONTS.title, fontSize: 42, color: '#fff', letterSpacing: 1.5, lineHeight: 46, marginBottom: SPACING.sm, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  overview:    { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: SPACING.lg, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  btnRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  playBtnContainer: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  playBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  playText:    { fontFamily: FONTS.bold, fontSize: 16, color: '#000', letterSpacing: 0.5 },
  moreBtnContainer: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  moreBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  moreText:    { fontFamily: FONTS.semibold, fontSize: 15, color: '#fff', letterSpacing: 0.5 },
  iconBtn:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
});
