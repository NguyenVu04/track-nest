"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Search, Filter, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { CrimeReport } from "@/types";
import { CrimeReportList } from "@/components/crime-reports/CrimeReportList";
import { toast } from "sonner";
import { PageTransition } from "@/components/animations/PageTransition";
import { useDebouncedCallback } from "use-debounce";
import { LoadingCard } from "@/components/loading/LoadingCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  criminalReportsService,
  CrimeReportResponse,
  PageResponse,
} from "@/services/criminalReportsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations } from "next-intl";

const CrimeHeatmapView = dynamic(
  () =>
    import("@/components/crime-reports/CrimeHeatmapView").then((mod) => ({
      default: mod.CrimeHeatmapView,
    })),
  {
    loading: () => <LoadingCard />,
    ssr: false,
  },
);

type ViewMode = "list" | "heatmap";

export default function CrimeReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations("crimeReports");

  const [crimeReports, setCrimeReports] = useState<CrimeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    const fetchCrimeReports = async () => {
      try {
        setIsLoading(true);
        const response: PageResponse<CrimeReportResponse> =
          await criminalReportsService.listCrimeReports({
            isPublic: false,
            page: 0,
            size: 100,
          });

        const mappedReports: CrimeReport[] = response.content.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          severity: item.severity as CrimeReport["severity"],
          date: item.date,
          longitude: item.longitude,
          latitude: item.latitude,
          numberOfVictims: item.numberOfVictims,
          numberOfOffenders: item.numberOfOffenders,
          arrested: item.arrested,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          reporterId: item.reporterId,
          isPublic: item.isPublic,
        }));

        setCrimeReports(mappedReports);
      } catch (error) {
        console.error("Error fetching crime reports:", error);
        toast.error(t("toastLoadError"));
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchCrimeReports();
    }
  }, [user, t]);

  const handleViewDetail = useCallback(
    (report: CrimeReport) => {
      router.push(`/dashboard/crime-reports/${report.id}`);
    },
    [router],
  );

  const handleCreateNew = useCallback(() => {
    router.push("/dashboard/crime-reports/create");
  }, [router]);

  const handlePublish = useCallback(
    async (id: string) => {
      const report = crimeReports.find((r) => r.id === id);
      if (!report) return;
      try {
        await criminalReportsService.publishCrimeReport(id);
        setCrimeReports(
          crimeReports.map((r) => (r.id === id ? { ...r, isPublic: true } : r)),
        );
        toast.success("Report published successfully");
      } catch (error) {
        toast.error("Error publishing report");
        console.error(error);
      }
    },
    [crimeReports],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await criminalReportsService.deleteCrimeReport(id);
        setCrimeReports(crimeReports.filter((r) => r.id !== id));
        toast.success(t("toastDeleted"));
      } catch (error) {
        toast.error(t("toastDeleteError"));
        console.error(error);
      }
    },
    [crimeReports, t],
  );

  const handleBackToList = () => {
    setViewMode("list");
  };

  const handleViewHeatmap = () => {
    setViewMode("heatmap");
  };

  const debouncedSetSearch = useDebouncedCallback(
    (value: string) => setSearchQuery(value),
    300,
  );

  const filteredReports = useMemo(() => {
    const getSearchableContent = (value: string) => {
      if (!value) return "";
      const trimmed = value.trim();
      if (trimmed.startsWith("<")) return trimmed;
      if (trimmed.startsWith("http") || trimmed.endsWith(".html")) return "";
      return trimmed;
    };

    return crimeReports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSearchableContent(report.content || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const severityMatch =
        severityFilter === "all" ||
        report.severity.toString() === severityFilter;

      return matchesSearch && severityMatch;
    });
  }, [crimeReports, searchQuery, severityFilter]);

  if (!user) return null;

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (viewMode === "heatmap") {
    return <CrimeHeatmapView onBack={handleBackToList} />;
  }

  return (
    <PageTransition>
      <div>
        <Breadcrumbs items={[{ label: t("pageTitle") }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-gray-900 text-xl font-semibold">
            {t("pageTitle")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewHeatmap}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                defaultValue={searchQuery}
                onChange={(e) => debouncedSetSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent appearance-none"
              >
                <option value="all">{t("filterAllSeverities")}</option>
                <option value="1">{t("severityVeryLow")}</option>
                <option value="2">{t("severityLow")}</option>
                <option value="3">{t("severityMedium")}</option>
                <option value="4">{t("severityHigh")}</option>
                <option value="5">{t("severityVeryHigh")}</option>
              </select>
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
    </PageTransition>
  );
}
