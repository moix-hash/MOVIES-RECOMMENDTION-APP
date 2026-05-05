// ─────────────────────────────────────────────────────────────────
//  Firebase v11 — Auth + Firestore + Google Sign-In
//  Setup: https://console.firebase.google.com → New Project → Free "Spark" plan
//  1. Create project
//  2. Enable Auth → Email/Password + Google provider
//  3. Enable Firestore Database
//  4. Paste config below (Project Settings → Your Apps → SDK config)
//
//  For Google Sign-In on native:
//  - Android: Add SHA-1 fingerprint in Firebase Console
//  - iOS: Download GoogleService-Info.plist → add to project root
//  - Set GOOGLE_WEB_CLIENT_ID in .env
// ─────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  increment,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';

// ─── PASTE YOUR FIREBASE CONFIG HERE ─────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
// ─────────────────────────────────────────────────────────────────

// Prevent re-initialization on hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ── Auth helpers ──────────────────────────────────────────────────

export const registerUser = async (email, password, displayName) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await setDoc(doc(db, 'users', user.uid), {
    displayName,
    email,
    photoURL:      null,
    provider:      'email',
    createdAt:     serverTimestamp(),
    watchlist:     [],
    watchedMovies: [],
    watchedCount:  0,
    genres:        [],          // preferred genres for recommendations
    isPro:         false,
  });
  return user;
};

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export const updateUserProfile = async (userId, data) => {
  const user = auth.currentUser;
  if (!user) return;

  // 1. Update Firebase Auth Profile
  await updateProfile(user, {
    displayName: data.displayName,
    photoURL:    data.photoURL,
  });

  // 2. Update Firestore Doc
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, {
    displayName: data.displayName,
    photoURL:    data.photoURL,
    birthday:    data.birthday || null,
  });
};

// ── Google Sign-In (works with expo-auth-session) ─────────────────
export const signInWithGoogle = async (idToken, accessToken) => {
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const result     = await signInWithCredential(auth, credential);
  const { user }   = result;

  // Create profile if first time
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      displayName:   user.displayName || 'Viewer',
      email:         user.email,
      photoURL:      user.photoURL,
      provider:      'google',
      createdAt:     serverTimestamp(),
      watchlist:     [],
      watchedMovies: [],
      watchedCount:  0,
      genres:        [],
      isPro:         false,
    });
  }
  return user;
};

// ── Watchlist ─────────────────────────────────────────────────────

export const toggleWatchlistItem = async (userId, movie, isCurrentlyFav) => {
  const ref       = doc(db, 'users', userId);
  const movieData = {
    id:           movie.id,
    title:        movie.title,
    poster_path:  movie.poster_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    genre_ids:    movie.genre_ids || [],
    addedAt:      new Date().toISOString(),
  };
  if (isCurrentlyFav) {
    // Remove by id field using arrayRemove won't work for objects, use filter approach
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const current = snap.data().watchlist || [];
      const updated = current.filter(m => m.id !== movie.id);
      await updateDoc(ref, { watchlist: updated });
    }
  } else {
    await updateDoc(ref, { watchlist: arrayUnion(movieData) });
  }
};

export const markAsWatched = async (userId, movie) => {
  const ref       = doc(db, 'users', userId);
  const watchData = {
    id:           movie.id,
    title:        movie.title,
    poster_path:  movie.poster_path,
    genre_ids:    movie.genre_ids || [],
    watchedAt:    new Date().toISOString(),
  };
  await updateDoc(ref, {
    watchedMovies: arrayUnion(watchData),
    watchedCount:  increment(1),
  });
};

export const updateGenrePreferences = async (userId, genres) => {
  await updateDoc(doc(db, 'users', userId), { genres });
};

export const subscribeToWatchlist = (userId, callback) => {
  const ref = doc(db, 'users', userId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data().watchlist || []);
  });
};

export const subscribeToUserProfile = (userId, callback) => {
  return onSnapshot(doc(db, 'users', userId), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
};

export const getUserProfile = async (userId) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
};

// ── Reviews ───────────────────────────────────────────────────────
export const addReview = async (userId, displayName, movieId, movieTitle, rating, text) => {
  await addDoc(collection(db, 'reviews'), {
    userId, displayName, movieId, movieTitle, rating, text,
    createdAt: serverTimestamp(),
    likes: 0,
  });
};

export const getMovieReviews = async (movieId) => {
  const q    = query(collection(db, 'reviews'), where('movieId', '==', movieId), orderBy('createdAt', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
