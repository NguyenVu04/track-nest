import AsyncStorage from "@react-native-async-storage/async-storage";

// Profile Storage Keys
const PROFILE_KEY = "@TrackNest:profile";
const PRIVACY_SETTINGS_KEY = "@TrackNest:privacy_settings";
const TOKEN_STORAGE_KEY = "@TrackNest:tokens";

// User Profile Types
export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  createdAt?: string;
}

// Privacy Settings
export interface PrivacySettings {
  // Location Sharing
  shareLocationWithFamily: boolean;
  shareLocationInRealTime: boolean;
  allowLocationHistory: boolean;
  
  // Data & Privacy
  allowCrimeNotifications: boolean;
  allowEmergencyAlerts: boolean;
  allowAnalytics: boolean;
  
  // Account
  twoFactorEnabled: boolean;
  sessionTimeout: number; // in minutes
}

// Default settings
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  shareLocationWithFamily: true,
  shareLocationInRealTime: true,
  allowLocationHistory: true,
  allowCrimeNotifications: true,
  allowEmergencyAlerts: true,
  allowAnalytics: true,
  twoFactorEnabled: false,
  sessionTimeout: 30,
};

// Profile Service
class ProfileService {
  // Get user profile from stored tokens
  async getProfile(): Promise<UserProfile | null> {
    try {
      const tokensJson = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (!tokensJson) return null;
      
      const tokens = JSON.parse(tokensJson);
      const idToken = tokens.idToken;
      
      if (idToken) {
        const payload = this.decodeJWT(idToken);
        
        if (payload) {
          return {
            userId: payload.sub || "",
            username: payload.preferred_username || "",
            email: payload.email || "",
            fullName: payload.name || payload.preferred_username,
            avatarUrl: payload.picture,
            role: payload.realm_access?.roles?.[0] || "USER",
            createdAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error("Failed to get profile:", error);
      return null;
    }
  }

  // Save custom profile data
  async saveProfileData(data: Partial<UserProfile>): Promise<void> {
    try {
      const existing = await this.getProfileData();
      const updated = { ...existing, ...data };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save profile data:", error);
      throw error;
    }
  }

  // Get custom profile data
  async getProfileData(): Promise<Partial<UserProfile> | null> {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to get profile data:", error);
      return null;
    }
  }

  // JWT decoder helper
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("JWT decode error:", error);
      return {};
    }
  }
}

// Privacy Settings Service
class PrivacySettingsService {
  // Get privacy settings
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const data = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(data) };
      }
      return DEFAULT_PRIVACY_SETTINGS;
    } catch (error) {
      console.error("Failed to get privacy settings:", error);
      return DEFAULT_PRIVACY_SETTINGS;
    }
  }

  // Save privacy settings
  async savePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const current = await this.getPrivacySettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
      throw error;
    }
  }

  // Update single setting
  async updateSetting<K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ): Promise<void> {
    await this.savePrivacySettings({ [key]: value });
  }

  // Reset to defaults
  async resetToDefaults(): Promise<void> {
    await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(DEFAULT_PRIVACY_SETTINGS));
  }

  // Export user data (for GDPR compliance)
  async exportUserData(): Promise<{
    profile: UserProfile | null;
    privacySettings: PrivacySettings;
    preferences: any;
  }> {
    const profileService = new ProfileService();
    const privacySettings = await this.getPrivacySettings();
    const profileData = await profileService.getProfileData();
    
    // Get other app preferences
    const preferences = {
      language: await AsyncStorage.getItem("@TrackNest:language"),
      tracking: await AsyncStorage.getItem("@TrackNest:tracking"),
      shareLocation: await AsyncStorage.getItem("@TrackNest:shareLocation"),
    };

    return {
      profile: { ...(await profileService.getProfile()), ...profileData } as UserProfile,
      privacySettings,
      preferences,
    };
  }

  // Request account deletion (placeholder for backend integration)
  async requestAccountDeletion(): Promise<void> {
    // In production, this would call a backend API to initiate deletion process
    // For now, we just store a flag
    await AsyncStorage.setItem("@TrackNest:account_deletion_requested", JSON.stringify({
      requestedAt: new Date().toISOString(),
      status: "pending",
    }));
  }
}

// Export singleton instances
export const profileService = new ProfileService();
export const privacySettingsService = new PrivacySettingsService();

export default { profileService, privacySettingsService };