import { Platform } from 'react-native';

// Backend URLs:
// - Production backend: https://api.revoshelf.com
// - Localhost (Android Emulator): http://10.0.2.2:8080
// - Localhost (iOS / Web): http://localhost:8080
const DEV_LOCAL_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
const PROD_URL = 'https://api.revoshelf.com';

// Set to PROD_URL by default so Expo Go on your physical phone connects immediately without needing local IP setup
export const API_BASE_URL = PROD_URL; // Or use DEV_LOCAL_URL when testing with a local backend
export const SOCKET_URL = API_BASE_URL;

export const APP_CONFIG = {
  appName: 'RevoShelf',
  version: '1.0.0',
  supportEmail: 'support@revoshelf.com',
  tagline: 'Buy & Sell College Essentials on Campus',
};
