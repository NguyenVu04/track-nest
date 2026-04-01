import { useState } from "react";
import { Plus, Search, BarChart3 } from "lucide-react";
import type { CrimeReport } from "@/types";
import { CrimeReportList } from "./CrimeReportList";
import { CrimeReportDetail } from "./CrimeReportDetail";
import { CrimeReportForm } from "./CrimeReportForm";
import { CrimeHeatmapView } from "./CrimeHeatmapView";

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
    content: "Car window smashed, items stolen from vehicle",
    severity: 3,
    date: "2026-01-03T22:30:00Z",
    longitude: -73.9776,
    latitude: 40.7614,
    numberOfVictims: 1,
    numberOfOffenders: 1,
    arrested: false,
    createdAt: "2026-01-04T08:00:00Z",
    updatedAt: "2026-01-04T08:00:00Z",
    reporterId: "user-1",
    isPublic: true,
  },
  {
    id: "2",
    title: "Assault - Street Altercation",
    content: "Physical altercation between two individuals",
    severity: 5,
    date: "2026-01-02T19:15:00Z",
    longitude: -73.9855,
    latitude: 40.758,
    numberOfVictims: 1,
    numberOfOffenders: 1,
    arrested: false,
    createdAt: "2026-01-02T19:30:00Z",
    updatedAt: "2026-01-02T19:30:00Z",
    reporterId: "user-2",
    isPublic: true,
  },
  {
    id: "3",
    title: "Burglary - Residential",
    content: "Break-in at residential apartment, valuables stolen",
    severity: 4,
    date: "2026-01-01T03:00:00Z",
    longitude: -73.9566,
    latitude: 40.7736,
    numberOfVictims: 1,
    numberOfOffenders: 2,
    arrested: false,
    createdAt: "2026-01-01T09:00:00Z",
    updatedAt: "2026-01-01T09:00:00Z",
    reporterId: "user-3",
    isPublic: true,
  },
  {
    id: "4",
    title: "Vandalism - Public Property",
    content: "Graffiti on public building",
    severity: 1,
    date: "2026-01-03T02:00:00Z",
    longitude: -74.006,
    latitude: 40.7128,
    numberOfVictims: 0,
    numberOfOffenders: 1,
    arrested: false,
    createdAt: "2026-01-03T08:00:00Z",
    updatedAt: "2026-01-03T08:00:00Z",
    reporterId: "user-4",
    isPublic: true,
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

  const handleViewDetail = (report: CrimeReport) => {
    setSelectedReport(report);
    setViewMode("detail");
  };

  const handleCreateNew = () => {
    setSelectedReport(null);
    setViewMode("create");
  };

  const handlePublish = (id: string) => {
    const report = crimeReports.find((r) => r.id === id);
    if (report) handleEdit(report);
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
      report.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <CrimeReportList
        reports={filteredReports}
        onViewDetail={handleViewDetail}
        onPublish={handlePublish}
        onDelete={handleDelete}
        userRole={user.role}
      />
    </div>
  );
}
