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

export interface PrivacySettings {
  shareLocationWithFamily: boolean;
  shareLocationInRealTime: boolean;
  allowLocationHistory: boolean;
  allowCrimeNotifications: boolean;
  allowEmergencyAlerts: boolean;
  allowAnalytics: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
}

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
