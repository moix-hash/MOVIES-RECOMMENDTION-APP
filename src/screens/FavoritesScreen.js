import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { toggleFavorite, syncToggleFavorite } from '../store/slices/favoritesSlice';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, TMDB_IMAGE_BASE } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.xl * 2 - SPACING.sm * 2) / 3;

export default function FavoritesScreen({ navigation }) {
  const dispatch       = useDispatch();
  const { user }       = useAuth();
  const { items, watched } = useSelector(s => s.favorites);
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' | 'watched'

  const data = activeTab === 'watchlist' ? items : watched;

  const handleRemove = (movie) => {
    dispatch(toggleFavorite(movie));
    dispatch(syncToggleFavorite({ userId: user?.uid, movie, isCurrentlyFav: true }));
  };

  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My List</Text>
        </View>
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} watchlistCount={items.length} watchedCount={watched.length} />
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{activeTab === 'watchlist' ? '🎬' : '✅'}</Text>
          <Text style={styles.emptyTitle}>{activeTab === 'watchlist' ? 'Your watchlist is empty' : 'No watched movies yet'}</Text>
          <Text style={styles.emptySub}>{activeTab === 'watchlist' ? 'Save movies to watch later' : 'Mark movies as watched to track them'}</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.browseBtnText}>Browse Movies</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My List</Text>
      </View>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} watchlistCount={items.length} watchedCount={watched.length} />

      <FlatList
        data={data}
        keyExtractor={item => String(item.id)}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: SPACING.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
            activeOpacity={0.85}
          >
            <View style={styles.posterWrap}>
              <Image
                source={{ uri: `${TMDB_IMAGE_BASE}${item.poster_path}` }}
                style={styles.poster}
                contentFit="cover"
                transition={200}
              />
              {/* Rating */}
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={9} color={COLORS.gold} />
                <Text style={styles.ratingText}> {item.vote_average?.toFixed(1)}</Text>
              </View>
              {/* Remove button */}
              {activeTab === 'watchlist' && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function TabBar({ activeTab, setActiveTab, watchlistCount, watchedCount }) {
  return (
    <View style={styles.tabs}>
      {[
        { key: 'watchlist', label: `Watchlist`, count: watchlistCount },
        { key: 'watched',   label: `Watched`,   count: watchedCount },
      ].map(t => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tab, activeTab === t.key && styles.tabActive]}
          onPress={() => setActiveTab(t.key)}
        >
          <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
            {t.label}
          </Text>
          <View style={[styles.tabBadge, activeTab === t.key && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === t.key && styles.tabBadgeTextActive]}>
              {t.count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.dark },
  header:          { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  title:           { fontFamily: FONTS.title, fontSize: 32, color: COLORS.text, letterSpacing: 1 },

  tabs:            { flexDirection: 'row', paddingHorizontal: SPACING.xl, marginBottom: SPACING.md, gap: SPACING.sm },
  tab:             { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: 8, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  tabActive:       { backgroundColor: COLORS.netflix, borderColor: COLORS.netflix },
  tabText:         { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.muted },
  tabTextActive:   { color: '#fff' },
  tabBadge:        { backgroundColor: COLORS.border, borderRadius: RADIUS.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  tabBadgeActive:  { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText:    { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.muted },
  tabBadgeTextActive: { color: '#fff' },

  grid:            { paddingHorizontal: SPACING.xl, paddingBottom: 100 },
  card:            { width: CARD_W, marginBottom: SPACING.lg },
  posterWrap:      { width: CARD_W, height: CARD_W * 1.45, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.surface, position: 'relative', marginBottom: 6 },
  poster:          { width: '100%', height: '100%' },
  ratingBadge:     { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  ratingText:      { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.gold },
  removeBtn:       { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  cardTitle:       { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text },
  cardYear:        { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, marginTop: 2 },

  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyIcon:       { fontSize: 52, marginBottom: SPACING.md },
  emptyTitle:      { fontFamily: FONTS.semibold, fontSize: 18, color: COLORS.text, marginBottom: SPACING.sm },
  emptySub:        { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginBottom: SPACING.xl },
  browseBtn:       { backgroundColor: COLORS.netflix, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.xxl },
  browseBtnText:   { fontFamily: FONTS.semibold, fontSize: 15, color: '#fff' },
});
