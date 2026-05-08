"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import viMessages from "@/messages/vi.json";

export type Locale = "en" | "vi";

const LOCALE_STORAGE_KEY = "tracknest_locale";

const allMessages = {
  en: enMessages,
  vi: viMessages,
};

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === "en" || stored === "vi" ? stored : "en";
  });

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    // Set cookie for server-side access (metadata, etc.)
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`; // 1 year
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={locale}
        messages={allMessages[locale]}
        // Suppress timezone warnings in test/SSR environments
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
