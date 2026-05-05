import { getSeverityLabel } from "@/utils/crimeHelpers";
import { criminalReportsService, CrimeReport, MissingPersonReport, GuidelinesDocument } from "./criminalReports";

// Legacy Types (for backward compatibility with UI components)
export type Report = {
  id: string;
  title: string;
  address: string;
  date: string;
  severity: "High" | "Medium" | "Low";
  description: string;
  photos?: string[];
};

export type MissingPerson = {
  id: string;
  name: string;
  age: number;
  description: string;
  lastSeen: string;
  photo?: string;
  severity: "High" | "Medium" | "Low";
};

export type Guide = {
  id: string;
  title: string;
  category: string;
  content: string;
  icon?: string;
};

// Adapter functions to convert backend types to UI types

/**
 * Convert CrimeReport (backend) to Report (UI)
 */
function adaptCrimeReportToReport(crimeReport: CrimeReport): Report {
  const date = new Date(crimeReport.createdAt);
  return {
    id: crimeReport.id,
    title: crimeReport.title,
    address: `${crimeReport.latitude.toFixed(4)}, ${crimeReport.longitude.toFixed(4)}`,
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    severity: getSeverityLabel(crimeReport.severity) as "High" | "Medium" | "Low",
    description: crimeReport.content || `Victims: ${crimeReport.numberOfVictims}, Offenders: ${crimeReport.numberOfOffenders}`,
    photos: crimeReport.photos,
  };
}

/**
 * Convert MissingPersonReport (backend) to MissingPerson (UI)
 */
function adaptMissingPersonToUI(missingPerson: MissingPersonReport): MissingPerson {
  const date = missingPerson.date ? new Date(missingPerson.date) : new Date(missingPerson.createdAt);
  return {
    id: missingPerson.id,
    name: missingPerson.fullName,
    age: 0, // Backend doesn't have age, estimate from personalId or set default
    description: missingPerson.content,
    lastSeen: date.toLocaleString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }),
    photo: missingPerson.photo,
    severity: "High" as const, // Default, can be calculated based on time missing
  };
}

/**
 * Convert GuidelinesDocument (backend) to Guide (UI)
 */
function adaptGuidelinesToGuide(guidelines: GuidelinesDocument): Guide {
  return {
    id: guidelines.id,
    title: guidelines.title,
    category: guidelines.isPublic ? "Published" : "Draft",
    content: guidelines.content,
  };
}

// API functions that use real backend

export async function fetchReports({
  page = 1,
  perPage = 10,
} = {}) {
  try {
    const response = await criminalReportsService.getUserCrimeReports(
      page - 1,
      perPage,
    );
    
    const adaptedReports = response.content.map(adaptCrimeReportToReport);
    return { 
      data: adaptedReports, 
      total: response.totalElements, 
      page 
    };
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    // Return empty data on error
    return { data: [] as Report[], total: 0, page };
  }
}

export async function getReportById(id: string) {
  try {
    const report = await criminalReportsService.getUserCrimeReportById(id);
    return adaptCrimeReportToReport(report);
  } catch (error) {
    console.error("Failed to get report by ID:", error);
    return undefined;
  }
}

export async function fetchMissingPersons({
  page = 1,
  perPage = 10,
} = {}) {
  try {
    const response = await criminalReportsService.getUserMissingPersonReports(
      page - 1,
      perPage,
    );
    
    const adaptedMissing = response.content.map(adaptMissingPersonToUI);
    return { 
      data: adaptedMissing, 
      total: response.totalElements, 
      page 
    };
  } catch (error) {
    console.error("Failed to fetch missing persons:", error);
    return { data: [] as MissingPerson[], total: 0, page };
  }
}

export async function fetchGuides({
  page = 1,
  perPage = 10,
} = {}) {
  try {
    const response = await criminalReportsService.getUserGuidelines(
      page - 1,
      perPage,
    );
    
    const adaptedGuides = response.content.map(adaptGuidelinesToGuide);
    return { 
      data: adaptedGuides, 
      total: response.totalElements, 
      page 
    };
  } catch (error) {
    console.error("Failed to fetch guides:", error);
    return { data: [] as Guide[], total: 0, page };
  }
}

// Keep mock data as fallback for offline/testing
export const MOCK: Report[] = [
  {
    id: "1",
    title: "Theft",
    address: "123 Main St, Downtown",
    date: "Dec 20, 2024",
    severity: "Medium",
    description: "Reported stolen bicycle from parking area",
  },
  {
    id: "2",
    title: "Assault",
    address: "456 Oak Ave, North District",
    date: "Dec 18, 2024",
    severity: "High",
    description: "Physical altercation reported near park",
  },
  {
    id: "3",
    title: "Vandalism",
    address: "789 Pine Rd, East Side",
    date: "Dec 15, 2024",
    severity: "Low",
    description: "Graffiti on public property",
  },
  {
    id: "4",
    title: "Burglary",
    address: "1010 Elm St",
    date: "Dec 10, 2024",
    severity: "High",
    description: "Break-in reported at residence",
  },
  {
    id: "5",
    title: "Robbery",
    address: "202 Pine St",
    date: "Dec 9, 2024",
    severity: "Medium",
    description: "Store reported held up",
  },
  {
    id: "6",
    title: "Missing Person",
    address: "N/A",
    date: "Dec 1, 2024",
    severity: "High",
    description: "Person not seen since last night",
  },
  {
    id: "7",
    title: "Burglary",
    address: "1010 Elm St",
    date: "Dec 10, 2024",
    severity: "High",
    description: "Break-in reported at residence",
  },
  {
    id: "8",
    title: "Robbery",
    address: "202 Pine St",
    date: "Dec 9, 2024",
    severity: "Medium",
    description: "Store reported held up",
  },
  {
    id: "9",
    title: "Missing Person",
    address: "N/A",
    date: "Dec 1, 2024",
    severity: "High",
    description: "Person not seen since last night",
  },
];

export const MOCK_MISSING: MissingPerson[] = [
  {
    id: "m1",
    name: "Sarah Johnson",
    age: 28,
    description: "Blonde hair, blue eyes, 5'6\", last wearing white jacket",
    lastSeen: "Dec 22, 2024, 3:30 PM at Central Park",
    severity: "High",
  },
  {
    id: "m2",
    name: "Michael Chen",
    age: 45,
    description: "Asian male, black hair, glasses, 5'8\"",
    lastSeen: "Dec 20, 2024, 9:00 AM leaving home",
    severity: "High",
  },
  {
    id: "m3",
    name: "Emma Wilson",
    age: 16,
    description: "Brown hair, 5'4\", wearing blue hoodie",
    lastSeen: "Dec 18, 2024, 4:00 PM near school",
    severity: "High",
  },
  {
    id: "m4",
    name: "David Rodriguez",
    age: 72,
    description: "Gray hair, 5'10\", has medical condition",
    lastSeen: "Dec 15, 2024, 10:00 AM near shopping center",
    severity: "High",
  },
  {
    id: "m5",
    name: "Sarah Johnson",
    age: 28,
    description: "Blonde hair, blue eyes, 5'6\", last wearing white jacket",
    lastSeen: "Dec 22, 2024, 3:30 PM at Central Park",
    severity: "High",
  },
  {
    id: "m6",
    name: "Michael Chen",
    age: 45,
    description: "Asian male, black hair, glasses, 5'8\"",
    lastSeen: "Dec 20, 2024, 9:00 AM leaving home",
    severity: "High",
  },
  {
    id: "m7",
    name: "Emma Wilson",
    age: 16,
    description: "Brown hair, 5'4\", wearing blue hoodie",
    lastSeen: "Dec 18, 2024, 4:00 PM near school",
    severity: "High",
  },
  {
    id: "m8",
    name: "David Rodriguez",
    age: 72,
    description: "Gray hair, 5'10\", has medical condition",
    lastSeen: "Dec 15, 2024, 10:00 AM near shopping center",
    severity: "High",
  },
];

export const MOCK_GUIDES: Guide[] = [
  {
    id: "g1",
    title: "Personal Safety Tips",
    category: "General Safety",
    content:
      "1. Always be aware of your surroundings\n2. Trust your instincts\n3. Keep emergency contacts handy\n4. Travel in groups when possible\n5. Share your location with trusted friends",
  },
  {
    id: "g2",
    title: "What to Do if You Feel Unsafe",
    category: "Emergency",
    content:
      "1. Move to a safe location immediately\n2. Call 911 or local emergency services\n3. Contact a trusted friend or family member\n4. Document the incident if possible\n5. Report to local police",
  },
  {
    id: "g3",
    title: "Home Security Best Practices",
    category: "Home Safety",
    content:
      "1. Keep doors and windows locked\n2. Install motion sensor lights\n3. Use a security system\n4. Don't advertise valuables\n5. Know your neighbors",
  },
  {
    id: "g4",
    title: "Traveling Safely",
    category: "Travel",
    content:
      "1. Plan your route in advance\n2. Use well-lit, populated routes\n3. Keep copies of important documents\n4. Register with your embassy if abroad\n5. Stay in contact with family",
  },
  {
    id: "g5",
    title: "Online Safety",
    category: "Digital Safety",
    content:
      "1. Use strong passwords\n2. Enable two-factor authentication\n3. Be cautious with personal information\n4. Verify links before clicking\n5. Report suspicious activity",
  },
];
