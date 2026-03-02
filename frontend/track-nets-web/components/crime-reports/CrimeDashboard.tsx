import { useState } from "react";
import { Plus, Search, Filter, BarChart3 } from "lucide-react";
import { CrimeReportList } from "./CrimeReportList";
import { CrimeReportDetail } from "./CrimeReportDetail";
import { CrimeReportForm } from "./CrimeReportForm";
import { CrimeHeatmapView } from "./CrimeHeatmapView";

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

interface CrimeDashboardProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

type ViewMode = "list" | "detail" | "create" | "edit" | "heatmap";

// Mock data
const mockCrimeReports: CrimeReport[] = [
  {
    id: "1",
    title: "Theft - Vehicle Break-in",
    type: "Theft",
    description: "Car window smashed, items stolen from vehicle",
    location: "Parking Garage, 5th Avenue",
    incidentDate: "2026-01-03T22:30:00Z",
    coordinates: [40.7614, -73.9776],
    zoneType: "circle",
    zoneRadius: 300,
    reportedBy: "NYPD Officer J. Smith",
    reportedDate: "2026-01-04T08:00:00Z",
    severity: "Medium",
    status: "Under Investigation",
  },
  {
    id: "2",
    title: "Assault - Street Altercation",
    type: "Assault",
    description: "Physical altercation between two individuals",
    location: "Broadway & 42nd Street",
    incidentDate: "2026-01-02T19:15:00Z",
    coordinates: [40.758, -73.9855],
    zoneType: "rectangle",
    zoneBounds: [
      [40.757, -73.9865],
      [40.759, -73.9845],
    ],
    reportedBy: "Witness Report",
    reportedDate: "2026-01-02T19:30:00Z",
    severity: "High",
    status: "Active",
  },
  {
    id: "3",
    title: "Burglary - Residential",
    type: "Burglary",
    description: "Break-in at residential apartment, valuables stolen",
    location: "Upper East Side Apartment Complex",
    incidentDate: "2026-01-01T03:00:00Z",
    coordinates: [40.7736, -73.9566],
    zoneType: "circle",
    zoneRadius: 250,
    reportedBy: "NYPD Officer M. Johnson",
    reportedDate: "2026-01-01T09:00:00Z",
    severity: "High",
    status: "Resolved",
  },
  {
    id: "4",
    title: "Vandalism - Public Property",
    type: "Vandalism",
    description: "Graffiti on public building",
    location: "City Hall Area",
    incidentDate: "2026-01-03T02:00:00Z",
    coordinates: [40.7128, -74.006],
    zoneType: "rectangle",
    zoneBounds: [
      [40.7118, -74.007],
      [40.7138, -74.005],
    ],
    reportedBy: "City Services",
    reportedDate: "2026-01-03T08:00:00Z",
    severity: "Low",
    status: "Active",
  },
];

export function CrimeDashboard({ user }: CrimeDashboardProps) {
  const [crimeReports, setCrimeReports] =
    useState<CrimeReport[]>(mockCrimeReports);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedReport, setSelectedReport] = useState<CrimeReport | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const handleViewDetail = (report: CrimeReport) => {
    setSelectedReport(report);
    setViewMode("detail");
  };

  const handleCreateNew = () => {
    setSelectedReport(null);
    setViewMode("create");
  };

  const handleEdit = (report: CrimeReport) => {
    setSelectedReport(report);
    setViewMode("edit");
  };

  const handleSave = (report: CrimeReport) => {
    if (viewMode === "create") {
      setCrimeReports([...crimeReports, report]);
    } else {
      setCrimeReports(
        crimeReports.map((r) => (r.id === report.id ? report : r)),
      );
    }
    setViewMode("list");
  };

  const handleDelete = (id: string) => {
    setCrimeReports(crimeReports.filter((r) => r.id !== id));
    if (selectedReport?.id === id) {
      setViewMode("list");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedReport(null);
  };

  const handleViewHeatmap = () => {
    setViewMode("heatmap");
  };

  const filteredReports = crimeReports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    const matchesSeverity =
      severityFilter === "all" || report.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  if (viewMode === "heatmap") {
    return (
      <CrimeHeatmapView reports={crimeReports} onBack={handleBackToList} />
    );
  }

  if (viewMode === "detail" && selectedReport) {
    return (
      <CrimeReportDetail
        report={selectedReport}
        onBack={handleBackToList}
        onEdit={handleEdit}
        onDelete={handleDelete}
        userRole={user.role}
      />
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <CrimeReportForm
        report={selectedReport}
        onSave={handleSave}
        onCancel={handleBackToList}
        mode={viewMode}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-gray-900">Crime Reports</h2>
        <div className="flex items-center gap-2">
          {user.role === "Emergency Services" && (
            <button
              onClick={handleViewHeatmap}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Crime Heatmap
            </button>
          )}
          {user.role === "Reporter" && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Report
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, location, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Types</option>
              <option value="Theft">Theft</option>
              <option value="Assault">Assault</option>
              <option value="Burglary">Burglary</option>
              <option value="Vandalism">Vandalism</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      <CrimeReportList
        reports={filteredReports}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        userRole={user.role}
      />
    </div>
  );
}
