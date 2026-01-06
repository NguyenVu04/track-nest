// Type helper for getting translations
import { AppLanguage } from "@/contexts/LanguageContext";

// Central export for all language files
export * as Card from "./Card";
export * as Fab from "./Fab";
export * as FollowerBottomSheet from "./FollowerBottomSheet";
export * as login from "./login";
export * as manageTrackers from "./manage-trackers";
export * as map from "./map";
export * as MapControls from "./MapControls";
export * as MapHeader from "./MapHeader";
export * as missingDetail from "./missing-detail";
export * as reportDetail from "./report-detail";
export * as reports from "./reports";
export * as settings from "./settings";

export type TranslationModule = {
  Vietnamese: Record<string, string>;
  English: Record<string, string>;
};

export function getTranslation<T extends TranslationModule>(
  module: T,
  language: AppLanguage
): T["English"] | T["Vietnamese"] {
  return module[language];
}
