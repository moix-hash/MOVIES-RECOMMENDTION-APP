import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function SkeletonLoader({ width, height, borderRadius = 8, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: COLORS.surfaceHigh, opacity }, style]}
    />
  );
}

export function SkeletonMovieCard({ size = 'md' }) {
  const w = size === 'sm' ? 110 : size === 'lg' ? 160 : 130;
  const h = size === 'sm' ? 156 : size === 'lg' ? 227 : 185;
  return (
    <View style={{ width: w, marginRight: 12 }}>
      <SkeletonLoader width={w} height={h} borderRadius={10} />
      <SkeletonLoader width={w * 0.75} height={12} borderRadius={6} style={{ marginTop: 8 }} />
      <SkeletonLoader width={w * 0.4}  height={10} borderRadius={6} style={{ marginTop: 4 }} />
    </View>
  );
}

export function SkeletonHero() {
  return (
    <View style={{ height: 520 }}>
      <SkeletonLoader width="100%" height={520} borderRadius={0} />
    </View>
  );
}
