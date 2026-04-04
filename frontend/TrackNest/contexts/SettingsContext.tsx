import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  GuardianMember,
  GuardianRole,
  GuardianPermission,
  VoiceSettings,
  VoiceCommand,
  guardianSettingsService,
  voiceSettingsService,
  DEFAULT_VOICE_COMMANDS,
} from "@/services/guardianSettings";
import { useAuth } from "./AuthContext";

interface SettingsContextType {
  // Guardian Management
  guardians: GuardianMember[];
  isLoadingGuardians: boolean;
  addGuardian: (guardian: { name: string; role: GuardianRole; phoneNumber?: string; email?: string }) => Promise<void>;
  updateGuardian: (id: string, updates: Partial<GuardianMember>) => Promise<void>;
  removeGuardian: (id: string) => Promise<void>;
  updateGuardianPermissions: (id: string, permissions: GuardianPermission[]) => Promise<void>;

  // Voice Command Management
  voiceSettings: VoiceSettings;
  isLoadingVoiceSettings: boolean;
  setVoiceEnabled: (enabled: boolean) => Promise<void>;
  toggleCommand: (commandId: string, enabled: boolean) => Promise<void>;
  addVoiceCommand: (command: { command: string; action: VoiceCommand["action"]; enabled: boolean }) => Promise<void>;
  removeVoiceCommand: (commandId: string) => Promise<void>;
  checkForSOSCommand: (transcript: string) => Promise<boolean>;

  // Refresh
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Guardian State
  const [guardians, setGuardians] = useState<GuardianMember[]>([]);
  const [isLoadingGuardians, setIsLoadingGuardians] = useState(false);

  // Voice Settings State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: true,
    commands: DEFAULT_VOICE_COMMANDS,
    language: "en-US",
  });
  const [isLoadingVoiceSettings, setIsLoadingVoiceSettings] = useState(false);

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    setIsLoadingGuardians(true);
    setIsLoadingVoiceSettings(true);
    
    try {
      // Load guardians
      const guardianData = await guardianSettingsService.getGuardianSettings();
      setGuardians(guardianData);
      
      // Load voice settings
      const voiceData = await voiceSettingsService.getVoiceSettings();
      setVoiceSettings(voiceData);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoadingGuardians(false);
      setIsLoadingVoiceSettings(false);
    }
  }, []);

  // Load on auth change
  useEffect(() => {
    loadSettings();
  }, [isAuthenticated, loadSettings]);

  // Guardian Functions
  const addGuardian = useCallback(async (guardian: { 
    name: string; 
    role: GuardianRole; 
    phoneNumber?: string; 
    email?: string 
  }) => {
    setIsLoadingGuardians(true);
    try {
      const defaultPermissions = guardianSettingsService.getDefaultPermissions(guardian.role);
      const newGuardian = await guardianSettingsService.addGuardian({
        ...guardian,
        permissions: defaultPermissions,
      });
      setGuardians(prev => [...prev, newGuardian]);
    } finally {
      setIsLoadingGuardians(false);
    }
  }, []);

  const updateGuardian = useCallback(async (id: string, updates: Partial<GuardianMember>) => {
    try {
      const updated = await guardianSettingsService.updateGuardian(id, updates);
      setGuardians(prev => prev.map(g => g.id === id ? updated : g));
    } catch (error) {
      console.error("Failed to update guardian:", error);
      throw error;
    }
  }, []);

  const removeGuardian = useCallback(async (id: string) => {
    try {
      await guardianSettingsService.removeGuardian(id);
      setGuardians(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error("Failed to remove guardian:", error);
      throw error;
    }
  }, []);

  const updateGuardianPermissions = useCallback(async (id: string, permissions: GuardianPermission[]) => {
    try {
      await guardianSettingsService.updateGuardianPermissions(id, permissions);
      setGuardians(prev => prev.map(g => g.id === id ? { ...g, permissions } : g));
    } catch (error) {
      console.error("Failed to update permissions:", error);
      throw error;
    }
  }, []);

  // Voice Functions
  const setVoiceEnabled = useCallback(async (enabled: boolean) => {
    try {
      await voiceSettingsService.setVoiceEnabled(enabled);
      setVoiceSettings(prev => ({ ...prev, enabled }));
    } catch (error) {
      console.error("Failed to set voice enabled:", error);
      throw error;
    }
  }, []);

  const toggleCommand = useCallback(async (commandId: string, enabled: boolean) => {
    try {
      await voiceSettingsService.toggleCommand(commandId, enabled);
      setVoiceSettings(prev => ({
        ...prev,
        commands: prev.commands.map(c => c.id === commandId ? { ...c, enabled } : c),
      }));
    } catch (error) {
      console.error("Failed to toggle command:", error);
      throw error;
    }
  }, []);

  const addVoiceCommand = useCallback(async (command: { 
    command: string; 
    action: VoiceCommand["action"]; 
    enabled: boolean 
  }) => {
    try {
      const newCommand = await voiceSettingsService.addCommand(command);
      setVoiceSettings(prev => ({
        ...prev,
        commands: [...prev.commands, newCommand],
      }));
    } catch (error) {
      console.error("Failed to add voice command:", error);
      throw error;
    }
  }, []);

  const removeVoiceCommand = useCallback(async (commandId: string) => {
    try {
      await voiceSettingsService.removeCommand(commandId);
      setVoiceSettings(prev => ({
        ...prev,
        commands: prev.commands.filter(c => c.id !== commandId),
      }));
    } catch (error) {
      console.error("Failed to remove voice command:", error);
      throw error;
    }
  }, []);

  const checkForSOSCommand = useCallback(async (transcript: string): Promise<boolean> => {
    return voiceSettingsService.checkForSOSCommand(transcript);
  }, []);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  // Context value
  const contextValue: SettingsContextType = {
    // Guardians
    guardians,
    isLoadingGuardians,
    addGuardian,
    updateGuardian,
    removeGuardian,
    updateGuardianPermissions,

    // Voice
    voiceSettings,
    isLoadingVoiceSettings,
    setVoiceEnabled,
    toggleCommand,
    addVoiceCommand,
    removeVoiceCommand,
    checkForSOSCommand,

    // Utility
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;