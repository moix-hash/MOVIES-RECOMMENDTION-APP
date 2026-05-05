import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const SettingRow = ({ icon, iconColor = COLORS.muted, label, sublabel, right, onPress }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={[styles.settingIcon, { backgroundColor: `${iconColor}18` }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.settingLabel}>
      <Text style={styles.settingText}>{label}</Text>
      {sublabel && <Text style={styles.settingSub}>{sublabel}</Text>}
    </View>
    {right}
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user }               = useAuth();
  const { items: favs, watched } = useSelector(s => s.favorites);
  const [notifs, setNotifs]    = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Viewer';
  const initials    = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isGoogle    = user?.providerData?.[0]?.providerId === 'google.com';

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      logoutUser();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel',   style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logoutUser },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* Profile header */}
        <LinearGradient
          colors={['rgba(229,9,20,0.12)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.profileTop}>
            {user?.photoURL
              ? <Image source={{ uri: user.photoURL }} style={styles.avatarImg} contentFit="cover" />
              : (
                <View style={styles.avatarLetters}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )
            }
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.providerBadge}>
                <Ionicons name={isGoogle ? 'logo-google' : 'mail-outline'} size={11} color={COLORS.muted} />
                <Text style={styles.providerText}>  {isGoogle ? 'Google account' : 'Email account'}</Text>
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { num: favs.length,    label: 'Saved',   icon: 'bookmark' },
              { num: watched.length, label: 'Watched', icon: 'checkmark-circle' },
              { num: '∞',            label: 'Reviews', icon: 'star' },
            ].map((s, i) => (
              <View key={i} style={[styles.statBox, i < 2 && styles.statDivider]}>
                <Ionicons name={s.icon} size={16} color={COLORS.netflix} style={{ marginBottom: 4 }} />
                <Text style={styles.statNum}>{s.num}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Sync badge */}
        <View style={styles.syncBadge}>
          <Ionicons name="cloud-done-outline" size={13} color={COLORS.green} />
          <Text style={styles.syncText}>  Watchlist synced to cloud</Text>
        </View>

        {/* Sections */}
        <SectionHeader label="ACCOUNT" />
        <View style={styles.section}>
          <SettingRow 
            icon="person-outline"      
            iconColor="#6B9FFF" 
            label="Edit Profile"         
            onPress={() => navigation.navigate('EditProfile')}
            right={<Ionicons name="chevron-forward" size={16} color={COLORS.mutedLight} />} 
          />
          <SettingRow icon="lock-closed-outline" iconColor="#FF9F6B" label="Privacy & Security"   right={<Ionicons name="chevron-forward" size={16} color={COLORS.mutedLight} />} />
          <SettingRow icon="diamond-outline"     iconColor={COLORS.gold} label="CineScope Pro" sublabel="Unlock all features"
            right={<View style={styles.proBadge}><Text style={styles.proText}>Upgrade</Text></View>}
          />
        </View>

        <SectionHeader label="PREFERENCES" />
        <View style={styles.section}>
          <SettingRow icon="notifications-outline" iconColor="#FF6B6B" label="Push Notifications" sublabel={notifs ? 'On' : 'Off'}
            right={<Switch value={notifs} onValueChange={setNotifs} thumbColor={COLORS.text} trackColor={{ true: COLORS.netflix, false: COLORS.border }} />}
          />
          <SettingRow icon="language-outline"      iconColor="#6BFF9F" label="Language"  right={<Text style={styles.rightVal}>English ›</Text>} />
          <SettingRow icon="film-outline"          iconColor="#9F6BFF" label="Autoplay Trailers" right={<Text style={styles.rightVal}>On ›</Text>} />
        </View>

        <SectionHeader label="ABOUT" />
        <View style={styles.section}>
          <SettingRow icon="information-circle-outline" iconColor={COLORS.muted} label="Version"         right={<Text style={styles.rightVal}>3.0.0</Text>} />
          <SettingRow icon="document-text-outline"      iconColor={COLORS.muted} label="Terms of Service" right={<Ionicons name="chevron-forward" size={16} color={COLORS.mutedLight} />} />
          <SettingRow icon="shield-outline"             iconColor={COLORS.muted} label="Privacy Policy"   right={<Ionicons name="chevron-forward" size={16} color={COLORS.mutedLight} />} />
        </View>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.netflix} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Powered by TMDB · Firebase · CineScope v3</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ label }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.dark },

  headerGradient:  { paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  profileTop:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  avatarImg:       { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface },
  avatarLetters:   { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.netflix, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { fontFamily: FONTS.title, fontSize: 28, color: '#fff' },
  profileInfo:     { flex: 1 },
  name:            { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
  email:           { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 2 },
  providerBadge:   { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  providerText:    { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted },

  statsRow:        { flexDirection: 'row', marginHorizontal: SPACING.xl, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  statBox:         { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg },
  statDivider:     { borderRightWidth: 1, borderRightColor: COLORS.border },
  statNum:         { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
  statLabel:       { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, letterSpacing: 1, marginTop: 2 },

  syncBadge:       { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: 'rgba(70,211,105,0.1)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 6, marginVertical: SPACING.md, borderWidth: 1, borderColor: 'rgba(70,211,105,0.2)' },
  syncText:        { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.green },

  sectionHeader:   { fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.muted, letterSpacing: 2, paddingHorizontal: SPACING.xl, marginBottom: SPACING.sm, marginTop: SPACING.lg },
  section:         { marginHorizontal: SPACING.xl, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },

  settingRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingIcon:     { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  settingLabel:    { flex: 1 },
  settingText:     { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
  settingSub:      { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 1 },
  rightVal:        { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
  proBadge:        { backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(245,197,24,0.3)' },
  proText:         { fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.gold },

  signOut:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginHorizontal: SPACING.xl, marginTop: SPACING.xxl, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(229,9,20,0.3)', borderRadius: RADIUS.md, backgroundColor: 'rgba(229,9,20,0.05)' },
  signOutText:     { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.netflix },

  footer:          { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.mutedLight, textAlign: 'center', marginTop: SPACING.xl },
});
