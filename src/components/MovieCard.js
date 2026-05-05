import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite, syncToggleFavorite, selectIsFavorite } from '../store/slices/favoritesSlice';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, TMDB_IMAGE_BASE } from '../constants/theme';

export default function MovieCard({ movie, onPress, size = 'md' }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const isFav    = useSelector(selectIsFavorite(movie.id));
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const favScaleAnim = useRef(new Animated.Value(1)).current;

  const cardWidth  = size === 'sm' ? 110 : size === 'lg' ? 160 : 130;
  const cardHeight = size === 'sm' ? 156 : size === 'lg' ? 227 : 185;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 150 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 150 }).start();
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  const handleFav = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const movieData = {
      id: movie.id, title: movie.title,
      poster_path: movie.poster_path, vote_average: movie.vote_average,
      release_date: movie.release_date, genre_ids: movie.genre_ids || [],
    };
    Animated.sequence([
      Animated.spring(favScaleAnim, { toValue: 1.3, useNativeDriver: true, tension: 200 }),
      Animated.spring(favScaleAnim, { toValue: 1.0, useNativeDriver: true, tension: 200 }),
    ]).start();
    dispatch(toggleFavorite(movieData));
    dispatch(syncToggleFavorite({ userId: user?.uid, movie: movieData, isCurrentlyFav: isFav }));
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.card, { width: cardWidth, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.posterWrap, { width: cardWidth, height: cardHeight }]}>
          <Image
            source={{ uri: `${TMDB_IMAGE_BASE}${movie.poster_path}` }}
            style={styles.poster}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
          {/* Gradient overlay */}
          <View style={styles.posterOverlay} />

          {/* Blur Rating badge */}
          <BlurView intensity={30} tint="dark" style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color={COLORS.gold} />
            <Text style={styles.ratingText}> {movie.vote_average?.toFixed(1)}</Text>
          </BlurView>

          {/* Fav button */}
          <Animated.View style={[styles.favBtnWrap, { transform: [{ scale: favScaleAnim }] }]}>
            <TouchableOpacity onPress={handleFav} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <BlurView intensity={30} tint="dark" style={styles.favBtn}>
                <Ionicons
                  name={isFav ? 'bookmark' : 'bookmark-outline'}
                  size={14}
                  color={isFav ? COLORS.netflix : '#fff'}
                />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={[styles.title, { width: cardWidth }]} numberOfLines={1}>{movie.title}</Text>
        <Text style={styles.year}>{movie.release_date?.slice(0, 4)}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card:         { marginBottom: SPACING.sm },
  posterWrap:   { borderRadius: 14, overflow: 'hidden', backgroundColor: COLORS.surface, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  poster:       { width: '100%', height: '100%' },
  posterOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  ratingBadge:  { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, overflow: 'hidden' },
  ratingText:   { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gold, marginLeft: 2 },
  favBtnWrap:   { position: 'absolute', top: 8, right: 8 },
  favBtn:       { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  title:        { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text, marginTop: 8, letterSpacing: 0.3 },
  year:         { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.muted, marginTop: 2 },
});
