import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

export default function EditProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [loading, setLoading] = useState(false);

  // Note: Local image picking requires expo-image-picker
  const handlePickImage = async () => {
    Alert.alert(
      'Image Picking',
      'Please install expo-image-picker to select local images. For now, you can paste a URL below.',
      [{ text: 'OK' }]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.uid, { 
        displayName: name.trim(), 
        photoURL: photoURL.trim(),
        birthday: birthday.trim()
      });
      if (Platform.OS === 'web') {
        alert('Profile updated successfully!');
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={COLORS.netflix} /> : <Text style={styles.saveHeaderBtn}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
              <View style={styles.avatarLarge}>
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.avatarImg} contentFit="cover" />
                ) : (
                  <Text style={styles.avatarTextLarge}>{name ? name[0].toUpperCase() : '?'}</Text>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Tap to change photo</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>DISPLAY NAME</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={COLORS.muted} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.muted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>BIRTHDAY (YYYY-MM-DD)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.muted} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={birthday}
                onChangeText={setBirthday}
                placeholder="Ex: 1995-05-15"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PROFILE IMAGE URL</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="image-outline" size={18} color={COLORS.muted} style={styles.icon} />
              <TextInput
                style={styles.input}
                value={photoURL}
                onChangeText={setPhotoURL}
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.disabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.dark },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  backBtn:        { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  saveHeaderBtn:  { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.netflix, paddingRight: 8 },

  scroll:         { padding: SPACING.xl },
  avatarSection:  { alignItems: 'center', marginBottom: SPACING.xxl },
  avatarLarge:    { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.netflix, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, position: 'relative' },
  avatarImg:      { width: 100, height: 100, borderRadius: 50 },
  avatarTextLarge:{ fontFamily: FONTS.title, fontSize: 40, color: '#fff' },
  editBadge:      { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.netflix, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.dark },
  avatarLabel:    { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },

  field:          { marginBottom: SPACING.xl },
  label:          { fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.muted, letterSpacing: 1.5, marginBottom: 8 },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md },
  icon:           { marginRight: SPACING.sm },
  input:          { flex: 1, paddingVertical: 14, fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text },

  saveBtn:        { backgroundColor: COLORS.netflix, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.md },
  disabled:       { opacity: 0.6 },
  saveBtnText:    { fontFamily: FONTS.semibold, fontSize: 16, color: '#fff' },
});
