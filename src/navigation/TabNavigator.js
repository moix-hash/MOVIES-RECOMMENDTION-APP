import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen     from '../screens/HomeScreen';
import SearchScreen   from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen  from '../screens/ProfileScreen';
import { COLORS, FONTS } from '../constants/theme';
import { useSelector } from 'react-redux';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',      icon: 'home',          iconOut: 'home-outline',          label: 'Home'    },
  { name: 'Search',    icon: 'search',         iconOut: 'search-outline',        label: 'Discover'},
  { name: 'Favorites', icon: 'bookmark',       iconOut: 'bookmark-outline',      label: 'My List' },
  { name: 'Profile',   icon: 'person-circle',  iconOut: 'person-circle-outline', label: 'Profile' },
];

function TabBarIcon({ name, focused }) {
  const favCount = useSelector(s => s.favorites.items.length);
  const showBadge = name === 'Favorites' && favCount > 0;

  return (
    <View style={[tabStyles.wrap, focused && tabStyles.wrapActive]}>
      <View>
        <Ionicons
          name={focused ? TABS.find(t => t.name === name)?.icon : TABS.find(t => t.name === name)?.iconOut}
          size={23}
          color={focused ? COLORS.netflix : COLORS.muted}
        />
        {showBadge && (
          <View style={tabStyles.badge}>
            <Text style={tabStyles.badgeText}>{favCount > 99 ? '99+' : favCount}</Text>
          </View>
        )}
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
        {TABS.find(t => t.name === name)?.label}
      </Text>
      {focused && <View style={tabStyles.dot} />}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: tabStyles.bar,
        tabBarBackground: () =>
          Platform.OS === 'ios'
            ? <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,10,0.97)' }]} />,
        tabBarIcon: ({ focused }) => <TabBarIcon name={route.name} focused={focused} />,
      })}
    >
      {TABS.map(t => <Tab.Screen key={t.name} name={t.name} component={
        t.name === 'Home'      ? HomeScreen      :
        t.name === 'Search'    ? SearchScreen    :
        t.name === 'Favorites' ? FavoritesScreen :
        ProfileScreen
      } />)}
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar:          { backgroundColor: 'transparent', borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1, height: Platform.OS === 'ios' ? 82 : 68, elevation: 0 },
  wrap:         { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, position: 'relative' },
  wrapActive:   { },
  label:        { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, marginTop: 3 },
  labelActive:  { color: COLORS.netflix, fontFamily: FONTS.medium },
  dot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.netflix, marginTop: 2 },
  badge:        { position: 'absolute', top: -4, right: -8, backgroundColor: COLORS.netflix, borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText:    { fontFamily: FONTS.bold, fontSize: 9, color: '#fff' },
});
