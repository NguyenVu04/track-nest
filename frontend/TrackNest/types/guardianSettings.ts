export type GuardianRole = "Parent" | "Child" | "Guardian" | "Grandparent" | "Spouse" | "Other";

export interface GuardianMember {
  id: string;
  name: string;
  role: GuardianRole;
  phoneNumber?: string;
  email?: string;
  addedAt: number;
  permissions: GuardianPermission[];
}

export type GuardianPermission =
  | "view_location"
  | "view_history"
  | "receive_emergency_alerts"
  | "manage_circle";

export interface VoiceCommand {
  id: string;
  command: string;
  action: "sos" | "location_share" | "stop_tracking" | "start_tracking";
  enabled: boolean;
}

export interface VoiceSettings {
  enabled: boolean;
  commands: VoiceCommand[];
  language: string;
}

export const DEFAULT_VOICE_COMMANDS: VoiceCommand[] = [
  { id: "1", command: "help me", action: "sos", enabled: true },
  { id: "2", command: "emergency", action: "sos", enabled: true },
  { id: "3", command: "help", action: "sos", enabled: true },
  { id: "4", command: "share my location", action: "location_share", enabled: true },
  { id: "5", command: "stop tracking", action: "stop_tracking", enabled: true },
  { id: "6", command: "start tracking", action: "start_tracking", enabled: true },
];
