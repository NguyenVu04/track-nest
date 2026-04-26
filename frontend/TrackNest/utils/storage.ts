import AsyncStorage from "@react-native-async-storage/async-storage";

// Load saved value from storage
export const loadSavedKey = async <T>(key: string): Promise<T | null> => {
  try {
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    /* ignore */
  }
  return null;
};

// Save value to storage
export const saveKey = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};
