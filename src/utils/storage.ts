import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache for fast synchronous access
const memoryCache = new Map<string, string>();

export const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) || null;
    }
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      memoryCache.set(key, value);
    }
    return value;
  } catch (error) {
    console.warn(`[SafeStorage] Failed to get item '${key}':`, error);
    return memoryCache.get(key) || null;
  }
};

export const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    memoryCache.set(key, value);
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[SafeStorage] Failed to set item '${key}':`, error);
  }
};

export const safeRemoveItem = async (key: string): Promise<void> => {
  try {
    memoryCache.delete(key);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`[SafeStorage] Failed to remove item '${key}':`, error);
  }
};

export const safeClear = async (): Promise<void> => {
  try {
    memoryCache.clear();
    await AsyncStorage.clear();
  } catch (error) {
    console.warn('[SafeStorage] Failed to clear storage:', error);
  }
};
