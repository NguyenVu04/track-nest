import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import type { UserProfile, PrivacySettings } from "@/types/profileSettings";
import { DEFAULT_PRIVACY_SETTINGS } from "@/types/profileSettings";
import { profileService, privacySettingsService } from "@/services/profileSettings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

interface ProfileContextType {
  // Profile
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;

  // Privacy Settings
  privacySettings: PrivacySettings;
  isLoadingPrivacy: boolean;
  loadPrivacySettings: () => Promise<void>;
  updatePrivacySetting: <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => Promise<void>;
  resetPrivacySettings: () => Promise<void>;

  // Data Management
  exportUserData: () => Promise<{
    profile: UserProfile | null;
    privacySettings: PrivacySettings;
    preferences: any;
  }>;
  requestAccountDeletion: () => Promise<void>;

  // Refresh
  refreshAll: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);

  // Load profile
  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const userProfile = await profileService.getProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    await profileService.saveProfileData(data);
    // Reload to get updated data
    await loadProfile();
  }, [loadProfile]);

  // Load privacy settings
  const loadPrivacySettings = useCallback(async () => {
    setIsLoadingPrivacy(true);
    try {
      const settings = await privacySettingsService.getPrivacySettings();
      setPrivacySettings(settings);
    } catch (error) {
      console.error("Failed to load privacy settings:", error);
    } finally {
      setIsLoadingPrivacy(false);
    }
  }, []);

  // Update single privacy setting
  const updatePrivacySetting = useCallback(async <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    await privacySettingsService.updateSetting(key, value);
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset privacy settings
  const resetPrivacySettings = useCallback(async () => {
    await privacySettingsService.resetToDefaults();
    setPrivacySettings(DEFAULT_PRIVACY_SETTINGS);
  }, []);

  // Export user data
  const exportUserData = useCallback(async () => {
    const [currentPrivacySettings, profileData, userProfile] = await Promise.all([
      privacySettingsService.getPrivacySettings(),
      profileService.getProfileData(),
      profileService.getProfile(),
    ]);
    const preferences = {
      language: await AsyncStorage.getItem("@TrackNest:language"),
      tracking: await AsyncStorage.getItem("@TrackNest:tracking"),
      shareLocation: await AsyncStorage.getItem("@TrackNest:shareLocation"),
    };
    return {
      profile: { ...userProfile, ...profileData } as UserProfile,
      privacySettings: currentPrivacySettings,
      preferences,
    };
  }, []);

  // Request account deletion
  const requestAccountDeletion = useCallback(async () => {
    await AsyncStorage.setItem(
      "@TrackNest:account_deletion_requested",
      JSON.stringify({ requestedAt: new Date().toISOString(), status: "pending" }),
    );
  }, []);

  // Refresh all
  const refreshAll = useCallback(async () => {
    await Promise.all([loadProfile(), loadPrivacySettings()]);
  }, [loadProfile, loadPrivacySettings]);

  // Load on auth change
  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    } else {
      setProfile(null);
      setPrivacySettings(DEFAULT_PRIVACY_SETTINGS);
    }
  }, [isAuthenticated, refreshAll]);

  // Context value
  const contextValue: ProfileContextType = {
    // Profile
    profile,
    isLoadingProfile,
    loadProfile,
    updateProfile,

    // Privacy Settings
    privacySettings,
    isLoadingPrivacy,
    loadPrivacySettings,
    updatePrivacySetting,
    resetPrivacySettings,

    // Data Management
    exportUserData,
    requestAccountDeletion,

    // Utility
    refreshAll,
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileContext;