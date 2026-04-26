import AsyncStorage from "@react-native-async-storage/async-storage";

// Guardian/Voice Preferences Storage Keys
const GUARDIAN_SETTINGS_KEY = "@TrackNest:guardian_settings";
const VOICE_SETTINGS_KEY = "@TrackNest:voice_settings";

// Guardian Role Types
export type GuardianRole = "Parent" | "Child" | "Guardian" | "Grandparent" | "Spouse" | "Other";

// Guardian Member
export interface GuardianMember {
  id: string;
  name: string;
  role: GuardianRole;
  phoneNumber?: string;
  email?: string;
  addedAt: number;
  permissions: GuardianPermission[];
}

// Guardian Permissions
export type GuardianPermission = 
  | "view_location" 
  | "view_history" 
  | "receive_emergency_alerts" 
  | "manage_circle";

// Voice Command
export interface VoiceCommand {
  id: string;
  command: string;
  action: "sos" | "location_share" | "stop_tracking" | "start_tracking";
  enabled: boolean;
}

// Voice Settings
export interface VoiceSettings {
  enabled: boolean;
  commands: VoiceCommand[];
  language: string;
}

// Default voice commands
export const DEFAULT_VOICE_COMMANDS: VoiceCommand[] = [
  { id: "1", command: "help me", action: "sos", enabled: true },
  { id: "2", command: "emergency", action: "sos", enabled: true },
  { id: "3", command: "help", action: "sos", enabled: true },
  { id: "4", command: "share my location", action: "location_share", enabled: true },
  { id: "5", command: "stop tracking", action: "stop_tracking", enabled: true },
  { id: "6", command: "start tracking", action: "start_tracking", enabled: true },
];

// Guardian Settings Service
class GuardianSettingsService {
  // Get guardian settings
  async getGuardianSettings(): Promise<GuardianMember[]> {
    try {
      const data = await AsyncStorage.getItem(GUARDIAN_SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error("Failed to get guardian settings:", error);
      return [];
    }
  }

  // Save guardian settings
  async saveGuardianSettings(guardians: GuardianMember[]): Promise<void> {
    try {
      await AsyncStorage.setItem(GUARDIAN_SETTINGS_KEY, JSON.stringify(guardians));
    } catch (error) {
      console.error("Failed to save guardian settings:", error);
      throw error;
    }
  }

  // Add a guardian
  async addGuardian(guardian: Omit<GuardianMember, "id" | "addedAt">): Promise<GuardianMember> {
    const guardians = await this.getGuardianSettings();
    const newGuardian: GuardianMember = {
      ...guardian,
      id: `guardian_${Date.now()}`,
      addedAt: Date.now(),
    };
    guardians.push(newGuardian);
    await this.saveGuardianSettings(guardians);
    return newGuardian;
  }

  // Update a guardian
  async updateGuardian(id: string, updates: Partial<GuardianMember>): Promise<GuardianMember> {
    const guardians = await this.getGuardianSettings();
    const index = guardians.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error("Guardian not found");
    }
    guardians[index] = { ...guardians[index], ...updates };
    await this.saveGuardianSettings(guardians);
    return guardians[index];
  }

  // Remove a guardian
  async removeGuardian(id: string): Promise<void> {
    const guardians = await this.getGuardianSettings();
    const filtered = guardians.filter(g => g.id !== id);
    await this.saveGuardianSettings(filtered);
  }

  // Update guardian permissions
  async updateGuardianPermissions(id: string, permissions: GuardianPermission[]): Promise<void> {
    const guardians = await this.getGuardianSettings();
    const index = guardians.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error("Guardian not found");
    }
    guardians[index].permissions = permissions;
    await this.saveGuardianSettings(guardians);
  }

  // Get default permissions for a role
  getDefaultPermissions(role: GuardianRole): GuardianPermission[] {
    switch (role) {
      case "Parent":
      case "Guardian":
        return ["view_location", "view_history", "receive_emergency_alerts", "manage_circle"];
      case "Grandparent":
      case "Spouse":
        return ["view_location", "view_history", "receive_emergency_alerts"];
      case "Child":
        return ["receive_emergency_alerts"];
      default:
        return ["view_location"];
    }
  }
}

// Voice Settings Service
class VoiceSettingsService {
  // Get voice settings
  async getVoiceSettings(): Promise<VoiceSettings> {
    try {
      const data = await AsyncStorage.getItem(VOICE_SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Return default settings
      return {
        enabled: true,
        commands: DEFAULT_VOICE_COMMANDS,
        language: "en-US",
      };
    } catch (error) {
      console.error("Failed to get voice settings:", error);
      return {
        enabled: true,
        commands: DEFAULT_VOICE_COMMANDS,
        language: "en-US",
      };
    }
  }

  // Save voice settings
  async saveVoiceSettings(settings: VoiceSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save voice settings:", error);
      throw error;
    }
  }

  // Toggle voice recognition enabled
  async setVoiceEnabled(enabled: boolean): Promise<void> {
    const settings = await this.getVoiceSettings();
    settings.enabled = enabled;
    await this.saveVoiceSettings(settings);
  }

  // Toggle a specific command
  async toggleCommand(commandId: string, enabled: boolean): Promise<void> {
    const settings = await this.getVoiceSettings();
    const command = settings.commands.find(c => c.id === commandId);
    if (command) {
      command.enabled = enabled;
      await this.saveVoiceSettings(settings);
    }
  }

  // Add a custom voice command
  async addCommand(command: Omit<VoiceCommand, "id">): Promise<VoiceCommand> {
    const settings = await this.getVoiceSettings();
    const newCommand: VoiceCommand = {
      ...command,
      id: `voice_cmd_${Date.now()}`,
    };
    settings.commands.push(newCommand);
    await this.saveVoiceSettings(settings);
    return newCommand;
  }

  // Remove a voice command
  async removeCommand(commandId: string): Promise<void> {
    const settings = await this.getVoiceSettings();
    settings.commands = settings.commands.filter(c => c.id !== commandId);
    await this.saveVoiceSettings(settings);
  }

  // Set language
  async setLanguage(language: string): Promise<void> {
    const settings = await this.getVoiceSettings();
    settings.language = language;
    await this.saveVoiceSettings(settings);
  }

  // Check if a transcript matches any enabled SOS commands
  async checkForSOSCommand(transcript: string): Promise<boolean> {
    const settings = await this.getVoiceSettings();
    if (!settings.enabled) return false;
    
    const lowerTranscript = transcript.toLowerCase();
    const sosCommands = settings.commands.filter(
      c => c.action === "sos" && c.enabled
    );
    
    return sosCommands.some(cmd => 
      lowerTranscript.includes(cmd.command.toLowerCase())
    );
  }
}

// Export singleton instances
export const guardianSettingsService = new GuardianSettingsService();
export const voiceSettingsService = new VoiceSettingsService();

export default { guardianSettingsService, voiceSettingsService };