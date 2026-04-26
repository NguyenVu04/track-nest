import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppLanguage, isAppLanguage } from "./language.types";

export const LANGUAGE_KEY = "@TrackNest:language";

export const loadSavedLanguage = async (): Promise<AppLanguage | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage && isAppLanguage(savedLanguage) ? savedLanguage : null;
  } catch (error) {
    console.error("Failed to load language preference:", error);
    return null;
  }
};

export const saveLanguage = async (lang: AppLanguage): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    return true;
  } catch (error) {
    console.error("Failed to save language preference:", error);
    return false;
  }
};
