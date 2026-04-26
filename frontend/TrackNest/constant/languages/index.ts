// Type helper for getting translations
import { AppLanguage } from "@/contexts/LanguageContext";

// Central export for all language files
export * as Card from "./Card";
export * as CircleMembersModal from "./CircleMembersModal";
export * as createReport from "./create-report";
export * as createMissing from "./create-missing";
export * as CurrentLocationMarker from "./CurrentLocationMarker";
export * as Fab from "./Fab";
export * as familyCircleNew from "./family-circle-new";
export * as FollowerBottomSheet from "./FollowerBottomSheet";
export * as FollowerInfo from "./FollowerInfo";
export * as locationHistory from "./location-history";
export * as login from "./login";
export * as manageTrackers from "./manage-trackers";
export * as map from "./map";
export * as MapControls from "./MapControls";
export * as MapHeader from "./MapHeader";
export * as MapTypeBottomSheet from "./MapTypeBottomSheet";
export * as missingDetail from "./missing-detail";
export * as notificationTest from "./notification-test";
export * as notifierTest from "./notifier-test";
export * as reportDetail from "./report-detail";
export * as reports from "./reports";
export * as settings from "./settings";
export * as sos from "./sos";
export * as tabs from "./tabs";
export * as trackerTest from "./tracker-test";
export * as trackingManagerTest from "./tracking-manager-test";

export type TranslationModule = {
  Vietnamese: Record<string, string>;
  English: Record<string, string>;
};

export function getTranslation<T extends TranslationModule>(
  module: T,
  language: AppLanguage,
): T["English"] | T["Vietnamese"] {
  return module[language];
}
