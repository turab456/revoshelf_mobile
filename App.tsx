import React from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { ToastProvider } from './src/context/ToastContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WishlistProvider>
          <ToastProvider>
            <RNStatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />
            <ExpoStatusBar style="dark" />
            <RootNavigator />
          </ToastProvider>
        </WishlistProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
