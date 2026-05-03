"use client";

import { useEffect, useState } from "react";
import { Plus, Search, BarChart3 } from "lucide-react";
import type { CrimeReport, UserRole } from "@/types";
import {
  criminalReportsService,
  CrimeReportResponse,
  CreateCrimeReportRequest,
  UpdateCrimeReportRequest,
} from "@/services/criminalReportsService";
import { CrimeReportList } from "./CrimeReportList";
import { CrimeReportDetail } from "./CrimeReportDetail";
import { CrimeReportForm } from "./CrimeReportForm";
import { CrimeHeatmapView } from "./CrimeHeatmapView";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CrimeDashboardProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole[];
  };
}

type ViewMode = "list" | "detail" | "create" | "edit" | "heatmap";

function mapResponse(r: CrimeReportResponse): CrimeReport {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    contentDocId: r.contentDocId,
    severity: r.severity as CrimeReport["severity"],
    date: r.date,
    longitude: r.longitude,
    latitude: r.latitude,
    numberOfVictims: r.numberOfVictims,
    numberOfOffenders: r.numberOfOffenders,
    arrested: r.arrested,
    photos: r.photos ?? [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    reporterId: r.reporterId,
    isPublic: r.isPublic,
  };
}

export function CrimeDashboard({ user }: CrimeDashboardProps) {
  const t = useTranslations("crimeReports");
  const tCommon = useTranslations("common");

  const [crimeReports, setCrimeReports] = useState<CrimeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedReport, setSelectedReport] = useState<CrimeReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    criminalReportsService
      .listCrimeReports({ page: 0, size: 100 })
      .then((res) => setCrimeReports(res.content.map(mapResponse)))
      .catch(() => toast.error(tCommon("loadError")))
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetail = (report: CrimeReport) => {
    setSelectedReport(report);
    setViewMode("detail");
  };

  const handleCreateNew = () => {
    setSelectedReport(null);
    setViewMode("create");
  };

  const handlePublish = async (id: string) => {
    try {
      const res = await criminalReportsService.publishCrimeReport(id);
      setCrimeReports((prev) =>
        prev.map((r) => (r.id === id ? mapResponse(res) : r)),
      );
      toast.success(tCommon("published"));
    } catch {
      toast.error(tCommon("actionError"));
    }
  };

  const handleEdit = (report: CrimeReport) => {
    setSelectedReport(report);
    setViewMode("edit");
  };

  const handleSave = async (report: CrimeReport) => {
    if (viewMode === "create") {
      const req: CreateCrimeReportRequest = {
        title: report.title,
        content: report.content,
        severity: report.severity,
        date: report.date.slice(0, 10),
        longitude: report.longitude,
        latitude: report.latitude,
        numberOfVictims: report.numberOfVictims,
        numberOfOffenders: report.numberOfOffenders,
        arrested: report.arrested,
        photos: report.photos ?? [],
      };
      const res = await criminalReportsService.createCrimeReport(req);
      setCrimeReports((prev) => [mapResponse(res), ...prev]);
    } else {
      const req: UpdateCrimeReportRequest = {
        title: report.title,
        content: report.content,
        severity: report.severity,
        date: report.date.slice(0, 10),
        numberOfVictims: report.numberOfVictims,
        numberOfOffenders: report.numberOfOffenders,
        arrested: report.arrested,
        photos: report.photos ?? [],
      };
      const res = await criminalReportsService.updateCrimeReport(report.id, req);
      setCrimeReports((prev) =>
        prev.map((r) => (r.id === report.id ? mapResponse(res) : r)),
      );
    }
    setViewMode("list");
  };

  const handleDelete = async (id: string) => {
    try {
      await criminalReportsService.deleteCrimeReport(id);
      setCrimeReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setViewMode("list");
    } catch {
      toast.error(tCommon("actionError"));
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedReport(null);
  };

  const filteredReports = crimeReports.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (viewMode === "heatmap") {
    return <CrimeHeatmapView onBack={handleBackToList} />;
  }

  if (viewMode === "detail" && selectedReport) {
    return (
      <CrimeReportDetail
        report={selectedReport}
        onBack={handleBackToList}
        onEdit={handleEdit}
        onPublish={handlePublish}
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
        <h2 className="text-gray-900">{t("pageTitle")}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("heatmap")}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {t("heatmap")}
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("newReport")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <CrimeReportList
          reports={filteredReports}
          onViewDetail={handleViewDetail}
          onPublish={handlePublish}
          onDelete={handleDelete}
          userRole={user.role}
        />
      )}
    </div>
  );
}
