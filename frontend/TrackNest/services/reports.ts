export type Report = {
  id: string;
  title: string;
  address: string;
  date: string;
  severity: "High" | "Medium" | "Low";
  description: string;
};

const MOCK: Report[] = [
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
];

export async function fetchReports({
  page = 1,
  perPage = 10,
  delay = 400,
} = {}) {
  // Simulate network delay
  return new Promise<{ data: Report[]; total: number; page: number }>(
    (resolve) => {
      setTimeout(() => {
        const start = (page - 1) * perPage;
        const data = MOCK.slice(start, start + perPage);
        resolve({ data, total: MOCK.length, page });
      }, delay);
    }
  );
}

export async function getReportById(id: string) {
  return new Promise<Report | undefined>((resolve) => {
    setTimeout(() => resolve(MOCK.find((r) => r.id === id)), 200);
  });
}
