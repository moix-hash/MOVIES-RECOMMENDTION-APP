# 🎬 CineScope v3

CineScope is a premium movie discovery and tracking application built with **React Native** and **Expo**. It provides a cinematic experience for browsing trending films, searching for classics, and managing your personal watchlist without any subscription fees.

---

## ✨ Features

- **🎬 Cinematic UI/UX**: Smooth animations, glassmorphism effects, and high-quality hero transitions.
- **🔐 Secure Authentication**: Multi-channel login via Firebase Auth (Email/Password & Google OAuth).
- **📡 Real-time Sync**: Watchlist and user profile data synced instantly across devices using Firestore.
- **🎥 TMDB Integration**: Powered by The Movie Database API for up-to-the-minute movie details, trailers, and recommendations.
- **🚀 Performance Optimized**: Uses FlashList for buttery-smooth scrolling and Redux Toolkit for efficient state management.
- **🎭 Personalization**: Customizable profiles, watched history, and genre-based filtering.

---

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) / [React Native](https://reactnative.dev/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Backend**: [Firebase](https://firebase.google.com/) (Auth & Firestore)
- **API**: [TMDB API](https://www.themoviedb.org/documentation/api)
- **Styling**: React Native StyleSheet with Glassmorphism and Blur effects
- **Navigation**: [React Navigation](https://reactnavigation.org/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Expo Go](https://expo.dev/expo-go) app on your mobile device (to test on hardware)
- A TMDB API Key
- A Firebase Project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/moix-hash/MOVIES-RECOMMENDTION-APP.git
   cd MOVIES-RECOMMENDTION-APP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and fill in your credentials (see `.env.example` for reference):
   ```env
   EXPO_PUBLIC_TMDB_API_KEY=your_key
   EXPO_PUBLIC_FIREBASE_API_KEY=your_key
   # ... add other firebase and google oauth keys
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

---

## 📸 Screenshots

| Home Screen | Movie Details | Search |
| :---: | :---: | :---: |
| ![Home](assets/placeholder.png) | ![Details](assets/placeholder.png) | ![Search](assets/placeholder.png) |

*(Note: Replace placeholders with actual screenshots for a better preview)*

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**CineScope** — *Unlimited movies. Zero subscriptions.*
