# RevoShelf Mobile App (React Native / Expo)

A complete, high-fidelity mobile application reproducing the **RevoShelf Campus Marketplace** web application. Built with **React Native**, **Expo SDK 57**, and **TypeScript**, targeting both **iOS** and **Android**.

---

## 📱 Features & Highlights

- **Exact Design & Theme Reproduction**:
  - Teal primary (`#038F78`), navy secondary (`#00244B`), warm background (`#FAF8F5`).
  - Flipkart-style product cards with image preview, percentage discount pills, and seller trust indicators.
  - Linear gradient category capsules and dynamic promotional banners.
  - Tactile haptic feedback on card touches, wishlist saves, button presses, and tab switches.

- **Navigation**:
  - **5-Tab Bottom Navigation**:
    - **Home**: Search trigger with rotating placeholders, category story rail, dynamic promo carousel, campus steal deals rail, 2-column product grid with pull-to-refresh.
    - **Search**: Real-time keyword search, category filter, condition pills, sort options, campus radius filter, and clear actions.
    - **Sell (Elevated Center FAB)**: Quick action button floating above the tab bar that directs authenticated users to listing creation or prompts login.
    - **Saved**: Wishlist items with unread badge count and optimistic toggles.
    - **Profile**: Student info, stats (active listings, sold count, trust rating), navigation to messages, inventory, settings, and support.
  - **Stack Navigation**:
    - Full listing details with multi-image gallery swiper, academic specs, safety advisory, and sticky chat/edit footer.
    - Listing creation with camera roll picker (`expo-image-picker`), auto-calculated savings, and multipart upload.
    - Real-time chat powered by Socket.IO with chat bubbles, timestamps, and item previews.
    - Authentication flows (Login, Register, Forgot Password, Reset Password, Email Verification).
    - Informational pages: About Us, How It Works, Safety Tips, Community Guidelines, FAQ, Contact Us, Report Issue, Terms, and Privacy Policy.

- **Resilient API & State Architecture**:
  - Centralized API layer with automatic Bearer token injection.
  - Token persistence via `@react-native-async-storage/async-storage` with automatic refresh token handling.
  - Offline fallback with high-quality mock data when the backend server is unreachable.
  - Automatic host detection for physical devices and Android emulators (`10.0.2.2`).

---

## 🛠️ Project Structure

```
campus_mobile/
├── App.tsx                     # App entry point with safe-area & context providers
├── app.json                    # Expo configuration
├── package.json                # Dependencies and scripts
└── src/
    ├── config/
    │   └── index.ts            # Dynamic environment configuration & API URLs
    ├── constants/
    │   ├── theme.ts            # Design tokens: colors, spacing, radius, shadows
    │   └── index.ts            # Categories, conditions, colleges, departments
    ├── context/
    │   ├── AuthContext.tsx     # Session management & user profile
    │   ├── WishlistContext.tsx # Wishlist persistence & optimistic toggles
    │   └── ToastContext.tsx    # Native animated floating toast notifications
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx      # Multi-variant button with haptics & loaders
    │   │   ├── Input.tsx       # Text & password input with icons & validation
    │   │   ├── Badge.tsx       # Condition and verification tags
    │   │   ├── Header.tsx      # Safe-area header with back and actions
    │   │   ├── EmptyState.tsx  # Empty states with iconography and CTAs
    │   │   └── SkeletonLoader.tsx # Pulsing shimmer loaders
    │   └── marketplace/
    │       ├── BookCard.tsx    # Flipkart-style product card
    │       ├── CategoryBar.tsx # Gradient category story capsules
    │       ├── PromoBannerCarousel.tsx # Dynamic promotional carousel
    │       ├── DealsRail.tsx   # Horizontal steal deals ribbon
    │       └── TrustIndicators.tsx # Campus trust checkmarks
    ├── navigation/
    │   ├── RootNavigator.tsx   # Native stack navigator for all 30 screens
    │   └── TabNavigator.tsx    # Bottom tab bar with elevated center FAB
    ├── screens/
    │   ├── main/
    │   │   ├── HomeScreen.tsx
    │   │   ├── SearchScreen.tsx
    │   │   ├── ListingDetailScreen.tsx
    │   │   ├── CreateListingScreen.tsx
    │   │   ├── EditListingScreen.tsx
    │   │   ├── SavedScreen.tsx
    │   │   ├── ProfileScreen.tsx
    │   │   ├── SellerProfileScreen.tsx
    │   │   ├── MyListingsScreen.tsx
    │   │   ├── MessagesScreen.tsx
    │   │   ├── ChatDetailScreen.tsx
    │   │   └── SettingsScreen.tsx
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   ├── ForgotPasswordScreen.tsx
    │   │   ├── ResetPasswordScreen.tsx
    │   │   └── VerifyEmailScreen.tsx
    │   └── static/
    │       ├── AboutUsScreen.tsx
    │       ├── ContactUsScreen.tsx
    │       ├── HelpCenterScreen.tsx
    │       ├── FaqScreen.tsx
    │       ├── SafetyTipsScreen.tsx
    │       ├── ReportIssueScreen.tsx
    │       ├── PrivacyPolicyScreen.tsx
    │       ├── TermsConditionsScreen.tsx
    │       ├── CommunityGuidelinesScreen.tsx
    │       └── HowItWorksScreen.tsx
    ├── services/
    │   ├── backendApi.ts       # REST client with auth headers & refresh
    │   ├── mockData.ts         # High-quality fallback seed data
    │   └── socket.ts           # Socket.IO client for live chat
    ├── types/
    │   └── index.ts            # TypeScript interfaces & navigation types
    └── utils/
        └── storage.ts          # Safe AsyncStorage wrapper
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- [Expo Go](https://expo.dev/client) app installed on your physical iOS or Android device (optional, for device preview)
- Android Studio or Xcode (optional, for emulators)

### 2. Start the Development Server
Navigate into the `campus_mobile` directory:
```bash
cd campus_mobile
npx expo start
```

### 3. Running on Devices
- **Physical Device**: Scan the QR code shown in the terminal using the Expo Go app (Android) or the Camera app (iOS).
- **Android Emulator**: Press `a` in the terminal.
- **iOS Simulator**: Press `i` in the terminal (macOS only).
- **Web Preview**: Press `w` in the terminal.

---

## ⚙️ Connecting to Backend

The mobile app configuration is in [`src/config/index.ts`](src/config/index.ts):
- **Android Emulator**: Automatically defaults to `http://10.0.2.2:8080`.
- **iOS Simulator / Web**: Automatically defaults to `http://localhost:8080`.
- **Physical Device**: Set `DEV_LOCAL_URL` to your machine's Wi-Fi IP address (e.g. `http://192.168.1.15:8080`).
- **Production Backend**: Configured to connect to `https://campus-be-qkrx.onrender.com`.
