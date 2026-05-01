import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  GuardianMember,
  GuardianPermission,
  GuardianRole,
  VoiceCommand,
  VoiceSettings,
} from "@/types/guardianSettings";
import { DEFAULT_VOICE_COMMANDS } from "@/types/guardianSettings";
export type {
  GuardianMember,
  GuardianPermission,
  GuardianRole,
  VoiceCommand,
  VoiceSettings,
} from "@/types/guardianSettings";
export { DEFAULT_VOICE_COMMANDS } from "@/types/guardianSettings";

const GUARDIAN_SETTINGS_KEY = "@TrackNest:guardian_settings";
const VOICE_SETTINGS_KEY = "@TrackNest:voice_settings";

class GuardianSettingsService {
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

  async saveGuardianSettings(guardians: GuardianMember[]): Promise<void> {
    try {
      await AsyncStorage.setItem(GUARDIAN_SETTINGS_KEY, JSON.stringify(guardians));
    } catch (error) {
      console.error("Failed to save guardian settings:", error);
      throw error;
    }
  }

  async addGuardian(
    guardian: Omit<GuardianMember, "id" | "addedAt">,
  ): Promise<GuardianMember> {
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

  async updateGuardian(
    id: string,
    updates: Partial<GuardianMember>,
  ): Promise<GuardianMember> {
    const guardians = await this.getGuardianSettings();
    const index = guardians.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error("Guardian not found");
    }
    guardians[index] = { ...guardians[index], ...updates };
    await this.saveGuardianSettings(guardians);
    return guardians[index];
  }

  async removeGuardian(id: string): Promise<void> {
    const guardians = await this.getGuardianSettings();
    const filtered = guardians.filter((g) => g.id !== id);
    await this.saveGuardianSettings(filtered);
  }

  async updateGuardianPermissions(
    id: string,
    permissions: GuardianPermission[],
  ): Promise<void> {
    const guardians = await this.getGuardianSettings();
    const index = guardians.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error("Guardian not found");
    }
    guardians[index].permissions = permissions;
    await this.saveGuardianSettings(guardians);
  }

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

class VoiceSettingsService {
  async getVoiceSettings(): Promise<VoiceSettings> {
    try {
      const data = await AsyncStorage.getItem(VOICE_SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
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

  async saveVoiceSettings(settings: VoiceSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save voice settings:", error);
      throw error;
    }
  }

  async setVoiceEnabled(enabled: boolean): Promise<void> {
    const settings = await this.getVoiceSettings();
    settings.enabled = enabled;
    await this.saveVoiceSettings(settings);
  }

  async toggleCommand(commandId: string, enabled: boolean): Promise<void> {
    const settings = await this.getVoiceSettings();
    const command = settings.commands.find((c) => c.id === commandId);
    if (command) {
      command.enabled = enabled;
      await this.saveVoiceSettings(settings);
    }
  }

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

  async removeCommand(commandId: string): Promise<void> {
    const settings = await this.getVoiceSettings();
    settings.commands = settings.commands.filter((c) => c.id !== commandId);
    await this.saveVoiceSettings(settings);
  }

  async setLanguage(language: string): Promise<void> {
    const settings = await this.getVoiceSettings();
    settings.language = language;
    await this.saveVoiceSettings(settings);
  }

  async checkForSOSCommand(transcript: string): Promise<boolean> {
    const settings = await this.getVoiceSettings();
    if (!settings.enabled) return false;

    const lowerTranscript = transcript.toLowerCase();
    const sosCommands = settings.commands.filter(
      (c) => c.action === "sos" && c.enabled,
    );

    return sosCommands.some((cmd) =>
      lowerTranscript.includes(cmd.command.toLowerCase()),
    );
  }
}

export const guardianSettingsService = new GuardianSettingsService();
export const voiceSettingsService = new VoiceSettingsService();

export default { guardianSettingsService, voiceSettingsService };
