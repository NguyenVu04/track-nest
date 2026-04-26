import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AppLanguage } from "./language.types";
import { loadSavedLanguage, saveLanguage } from "./languageStorage";

export type { AppLanguage } from "./language.types";

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<AppLanguage>("English");

  // Load saved language preference on mount
  useEffect(() => {
    loadSavedLanguage().then((savedLanguage) => {
      if (savedLanguage) {
        setLanguageState(savedLanguage);
      }
    });
  }, []);

  const setLanguage = async (lang: AppLanguage) => {
    const didSave = await saveLanguage(lang);
    if (didSave) {
      setLanguageState(lang);
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
