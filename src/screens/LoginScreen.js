import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { registerUser, loginUser, resetPassword, signInWithGoogle } from '../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

// Google OAuth config using environment variables
// FIX: expo-auth-session v6+ uses clientId instead of deprecated expoClientId
const GOOGLE_CLIENT_ID      = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// High-quality cinematic background video URL
const BACKGROUND_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-out-of-focus-39850-large.mp4';

export default function LoginScreen() {
  const [tab,       setTab]       = useState('login');
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [gLoading,  setGLoading]  = useState(false);
  const [error,     setError]     = useState('');
  const [resetSent, setResetSent] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  // FIX: Use clientId instead of deprecated expoClientId (expo-auth-session v6+)
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:       GOOGLE_CLIENT_ID,
    iosClientId:     GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId:     GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleSignIn(authentication.idToken, authentication.accessToken);
    }
  }, [response]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60,  useNativeDriver: true }),
    ]).start();
  };

  const showError = (msg) => {
    setError(msg);
    shake();
  };

  const handleGoogleSignIn = async (idToken, accessToken) => {
    setGLoading(true);
    try {
      await signInWithGoogle(idToken, accessToken);
    } catch (e) {
      showError('Google sign-in failed. Please try again.');
    } finally {
      setGLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { showError('Please fill in all fields.'); return; }
    if (tab === 'signup' && !name.trim()) { showError('Please enter your name.'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (tab === 'signup') await registerUser(email.trim(), password, name.trim());
      else                  await loginUser(email.trim(), password);
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Email already registered. Sign in instead.',
        'auth/invalid-email':        'Invalid email address.',
        'auth/weak-password':        'Password must be at least 6 characters.',
        'auth/user-not-found':       'No account found with this email.',
        'auth/wrong-password':       'Incorrect password.',
        'auth/invalid-credential':   'Incorrect email or password.',
        'auth/too-many-requests':    'Too many attempts. Try again later.',
      };
      showError(msgs[e.code] || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { showError('Enter your email first.'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setResetSent(true);
      setError('');
    } catch (e) {
      showError('Could not send reset email. Check the address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Cinematic Video Background */}
      <Video
        source={{ uri: BACKGROUND_VIDEO }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      
      {/* Dark overlay for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim, flex: 1, justifyContent: 'center' }}>
              {/* Logo */}
              <View style={styles.logoWrap}>
                <Text style={styles.logo}>CINESCOPE</Text>
                <View style={styles.logoDivider} />
                <Text style={styles.tagline}>Unlimited movies. Zero subscriptions.</Text>
              </View>

              <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
                {/* Tab switcher */}
                <View style={styles.tabRow}>
                  {['login', 'signup'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tab, tab === t && styles.tabActive]}
                      onPress={() => { setTab(t); setError(''); setResetSent(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                        {t === 'login' ? 'Sign In' : 'Create Account'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Google Button */}
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={() => promptAsync()}
                  disabled={!request || gLoading}
                  activeOpacity={0.8}
                >
                  {gLoading
                    ? <ActivityIndicator size="small" color={COLORS.text} />
                    : <>
                        <Ionicons name="logo-google" size={18} color="#4285F4" />
                        <Text style={styles.googleText}>Continue with Google</Text>
                      </>
                  }
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Fields */}
                {tab === 'signup' && (
                  <View style={styles.fieldWrap}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="person-outline" size={16} color={COLORS.muted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Your name"
                        placeholderTextColor={COLORS.muted}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>EMAIL</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={16} color={COLORS.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.muted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="lock-closed-outline" size={16} color={COLORS.muted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={tab === 'signup' ? 'Min. 6 characters' : 'Your password'}
                      placeholderTextColor={COLORS.muted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPass}
                    />
                    <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={16} color={COLORS.muted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {tab === 'login' && (
                  <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                {resetSent && (
                  <View style={styles.successBox}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                    <Text style={styles.successText}>  Reset email sent! Check your inbox.</Text>
                  </View>
                )}

                {!!error && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.red} />
                    <Text style={styles.errorText}>  {error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#E50914', '#B20710']}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.submitText}>{tab === 'login' ? 'Sign In' : 'Create Account'}</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.switchText}>
                  {tab === 'login' ? "Don't have an account? " : 'Already have one? '}
                  <Text
                    style={styles.switchLink}
                    onPress={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); }}
                  >
                    {tab === 'login' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </Animated.View>

              <Text style={styles.footer}>
                🔒 Secure authentication powered by Firebase
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#000' },
  scroll:        { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingBottom: 40, justifyContent: 'center', minHeight: height - 80 },

  logoWrap:      { alignItems: 'center', marginBottom: SPACING.xxl },
  logo:          { fontFamily: FONTS.title, fontSize: 52, color: COLORS.text, letterSpacing: 8 },
  logoDivider:   { width: 40, height: 3, backgroundColor: COLORS.netflix, borderRadius: 2, marginVertical: SPACING.sm },
  tagline:       { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },

  card:          { backgroundColor: 'rgba(15,15,15,0.75)', borderRadius: RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },

  tabRow:        { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, padding: 3, marginBottom: SPACING.lg },
  tab:           { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.md - 2 },
  tabActive:     { backgroundColor: COLORS.netflix },
  tabText:       { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.muted },
  tabTextActive: { color: '#fff' },

  googleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.md, paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: SPACING.lg },
  googleText:    { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },

  dividerRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  dividerLine:   { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText:   { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginHorizontal: SPACING.md },

  fieldWrap:     { marginBottom: SPACING.md },
  label:         { fontFamily: FONTS.semibold, fontSize: 10, color: COLORS.muted, letterSpacing: 2, marginBottom: 6 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: SPACING.md },
  inputIcon:     { marginRight: SPACING.sm },
  input:         { flex: 1, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },

  forgotBtn:     { alignSelf: 'flex-end', marginBottom: SPACING.md },
  forgotText:    { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSub },

  errorBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(229,9,20,0.1)', borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(229,9,20,0.2)' },
  errorText:     { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.red, flex: 1 },
  successBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(70,211,105,0.1)', borderRadius: RADIUS.sm, padding: SPACING.sm, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(70,211,105,0.2)' },
  successText:   { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.green },

  submitBtn:     { marginTop: SPACING.sm, marginBottom: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden' },
  submitGradient:{ paddingVertical: 14, alignItems: 'center' },
  submitText:    { fontFamily: FONTS.semibold, fontSize: 15, color: '#fff', letterSpacing: 0.5 },

  switchText:    { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, textAlign: 'center' },
  switchLink:    { color: COLORS.text, fontFamily: FONTS.medium },

  footer:        { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.mutedLight, textAlign: 'center', marginTop: SPACING.xl },
});
