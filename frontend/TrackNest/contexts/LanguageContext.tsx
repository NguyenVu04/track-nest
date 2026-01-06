import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useState } from "react";

const LANGUAGE_KEY = "@TrackNest:language";

export type AppLanguage = "English" | "Vietnamese";

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<AppLanguage>("English");

  // Load saved language preference on mount
  React.useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage === "Vietnamese" || savedLanguage === "English") {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error("Failed to load language preference:", error);
    }
  };

  const setLanguage = async (lang: AppLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
