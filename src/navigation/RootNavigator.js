import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import TabNavigator     from './TabNavigator';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import AllMoviesScreen  from '../screens/AllMoviesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import LoginScreen      from '../screens/LoginScreen';
import { useAuth }      from '../context/AuthContext';
import { subscribeToWatchlist, subscribeToUserProfile } from '../services/firebase';
import { setWatchlistFromCloud, setWatchedFromCloud } from '../store/slices/favoritesSlice';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const dispatch = useDispatch();

  // FIX: Also sync watched movies from Firestore on login, not just watchlist
  useEffect(() => {
    if (!user) return;

    // Real-time watchlist sync
    const unsubWatchlist = subscribeToWatchlist(user.uid, (watchlist) => {
      dispatch(setWatchlistFromCloud(watchlist));
    });

    // Real-time watched movies sync
    const unsubProfile = subscribeToUserProfile(user.uid, (profile) => {
      dispatch(setWatchedFromCloud(profile.watchedMovies || []));
    });

    return () => {
      unsubWatchlist();
      unsubProfile();
    };
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.netflix} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user
        ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        )
        : (
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.dark },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Tabs"        component={TabNavigator} />
            <Stack.Screen name="MovieDetail" component={MovieDetailScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="AllMovies"   component={AllMoviesScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </Stack.Navigator>
        )
      }
    </NavigationContainer>
  );
}
