import { TranslationModule, getTranslation } from "@/constant/languages";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Custom hook to get translations for a specific module
 *
 * @param translationModule - The translation module to use (e.g., login, settings)
 * @returns Translation object for current language
 *
 * @example
 * ```typescript
 * import { useTranslation } from "@/hooks/useTranslation";
 * import { login } from "@/constant/languages";
 *
 * export default function LoginScreen() {
 *   const t = useTranslation(login);
 *
 *   return <Text>{t.pageTitle}</Text>;
 * }
 * ```
 */
export function useTranslation<T extends TranslationModule>(
  translationModule: T
): T["English"] | T["Vietnamese"] {
  const { language } = useLanguage();
  return getTranslation(translationModule, language);
}
