import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PRIVACY_SETTINGS,
  type PrivacySettings,
  type UserProfile,
} from "@/types/profileSettings";

export { DEFAULT_PRIVACY_SETTINGS, type PrivacySettings, type UserProfile };

const PROFILE_KEY = "@TrackNest:profile";
const PRIVACY_SETTINGS_KEY = "@TrackNest:privacy_settings";
const TOKEN_STORAGE_KEY = "@TrackNest:tokens";

class ProfileService {
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

  async getProfileData(): Promise<Partial<UserProfile> | null> {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to get profile data:", error);
      return null;
    }
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("JWT decode error:", error);
      return {};
    }
  }
}

class PrivacySettingsService {
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

  async updateSetting<K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K],
  ): Promise<void> {
    await this.savePrivacySettings({ [key]: value });
  }

  async resetToDefaults(): Promise<void> {
    await AsyncStorage.setItem(
      PRIVACY_SETTINGS_KEY,
      JSON.stringify(DEFAULT_PRIVACY_SETTINGS),
    );
  }
}

export const profileService = new ProfileService();
export const privacySettingsService = new PrivacySettingsService();

export default { profileService, privacySettingsService };
