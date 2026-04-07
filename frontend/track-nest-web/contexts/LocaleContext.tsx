"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import viMessages from "@/messages/vi.json";

export type Locale = "en" | "vi";

const LOCALE_STORAGE_KEY = "tracknest_locale";

const allMessages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  vi: viMessages as typeof enMessages,
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
  const [locale, setLocaleState] = useState<Locale>("en");

  // Read persisted locale on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "vi") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
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
