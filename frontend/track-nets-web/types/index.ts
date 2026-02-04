export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  role: "Admin" | "Reporter" | "Emergency Services";
  fullName: string;
  status?: "Active" | "Banned";
  createdAt?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: "create" | "edit" | "delete" | "publish" | "ban" | "unban";
  targetType:
    | "missing-person"
    | "crime-report"
    | "guideline"
    | "emergency-request"
    | "account"
    | "safe-zone";
  targetId: string;
  targetName: string;
  timestamp: string;
  details?: string;
}

export interface MissingPerson {
  id: string;
  name: string;
  age: number;
  gender: string;
  description: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  coordinates: [number, number];
  status: "Unhandled" | "Published" | "Resolved";
  reportedBy: string;
  reportedDate: string;
  contactInfo: string;
  photoUrl?: string;
}

export interface CrimeReport {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  incidentDate: string;
  coordinates: [number, number];
  zoneType: "circle" | "rectangle";
  zoneRadius?: number;
  zoneBounds?: [[number, number], [number, number]];
  reportedBy: string;
  reportedDate: string;
  severity: "Low" | "Medium" | "High";
  status: "Active" | "Under Investigation" | "Resolved";
}

export interface Guideline {
  id: string;
  title: string;
  description: string;
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  fileUrl?: string;
  content: string;
}

export interface EmergencyRequest {
  id: string;
  requesterName: string;
  requesterContact: string;
  location: string;
  coordinates: [number, number];
  createdAt: string;
  status: "Pending" | "Accepted" | "Rejected" | "Completed";
  rejectReason?: string;
  completionNote?: string;
}

export interface SafeZone {
  id: string;
  name: string;
  type: "Police Station" | "Hospital" | "Shelter" | "Other";
  address: string;
  coordinates: [number, number];
  createdAt: string;
}
