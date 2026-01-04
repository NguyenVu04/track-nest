export interface User {
  id: string;
  username: string;
  email: string;
  role: "Reporter" | "Emergency Services";
  fullName: string;
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
