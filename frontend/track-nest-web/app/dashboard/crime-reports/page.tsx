"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Search, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { CrimeReport } from "@/types";
import { CrimeReportList } from "@/components/crime-reports/CrimeReportList";
import { toast } from "sonner";
import { PageTransition } from "@/components/animations/PageTransition";
import { LoadingCard } from "@/components/loading/LoadingCard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { criminalReportsService, CrimeReportResponse } from "@/services/criminalReportsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { usePagedList } from "@/hooks/usePagedList";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CrimeHeatmapView = dynamic(
  () =>
    import("@/components/crime-reports/CrimeHeatmapView").then((mod) => ({
      default: mod.CrimeHeatmapView,
    })),
  { loading: () => <LoadingCard />, ssr: false },
);

const PAGE_SIZE = 10;

type ViewMode = "list" | "heatmap";

function getSeverityParams(filter: string): { minSeverity?: number; maxSeverity?: number } {
  if (filter === "high")   return { minSeverity: 4 };
  if (filter === "medium") return { minSeverity: 3, maxSeverity: 3 };
  if (filter === "low")    return { maxSeverity: 2 };
  return {};
}

function mapResponseToLocal(item: CrimeReportResponse): CrimeReport {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    contentDocId: item.contentDocId,
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
  };
}

export default function CrimeReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations("crimeReports");

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [severityFilter, setSeverityFilter] = useState("all");

  const {
    items: crimeReports,
    isLoading,
    totalPages,
    totalElements,
    currentPage,
    setSearch,
    setTab,
    setPage,
    refresh,
  } = usePagedList<CrimeReport>(
    ({ page, size, searchTitle, tab }) =>
      criminalReportsService
        .listCrimeReports({
          isPublic: false,
          page,
          size,
          title: searchTitle.trim() || undefined,
          ...getSeverityParams(tab),
        })
        .then((response) => ({
          content: response.content.map(mapResponseToLocal),
          totalPages: response.totalPages,
          totalElements: response.totalElements,
        }))
        .catch(() => {
          toast.error(t("toastLoadError"));
          return { content: [], totalPages: 0, totalElements: 0 };
        }),
    "all",
    0,
    PAGE_SIZE,
    !!user,
  );

  const handleSeverityChange = (filter: string) => {
    setSeverityFilter(filter);
    setTab(filter);
  };

  const handleViewDetail = useCallback((report: CrimeReport) => {
    router.push(`/dashboard/crime-reports/${report.id}`);
  }, [router]);

  const handleEdit = useCallback((report: CrimeReport) => {
    router.push(`/dashboard/crime-reports/${report.id}/edit`);
  }, [router]);

  const handleCreateNew = useCallback(() => {
    router.push("/dashboard/crime-reports/create");
  }, [router]);

  const handlePublish = useCallback(async (id: string) => {
    try {
      await criminalReportsService.publishCrimeReport(id);
      toast.success("Report published successfully");
      refresh();
    } catch (error) {
      toast.error("Error publishing report");
      console.error(error);
    }
  }, [refresh]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await criminalReportsService.deleteCrimeReport(id);
      toast.success(t("toastDeleted"));
      refresh();
    } catch (error) {
      toast.error(t("toastDeleteError"));
      console.error(error);
    }
  }, [t, refresh]);

  if (!user) return null;

  if (viewMode === "heatmap") {
    return <CrimeHeatmapView onBack={() => setViewMode("list")} />;
  }

  const severityTabs = [
    { id: "all",    label: t("filterAllSeverities") },
    { id: "high",   label: t("severityHigh") },
    { id: "medium", label: t("severityMedium") },
    { id: "low",    label: t("severityLow") },
  ];

  const rangeStart = totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const rangeEnd   = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);

  const pageNumbers: number[] = [];
  const windowSize = 5;
  let start = Math.max(0, currentPage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages - 1, start + windowSize - 1);
  if (end - start < windowSize - 1) start = Math.max(0, end - windowSize + 1);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto pb-12">
        <Breadcrumbs items={[{ label: t("pageTitle") }]} />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Crime Reports Management</h1>
            <p className="text-gray-500 mt-2 text-lg">Monitor, assign, and resolve active incidents within your jurisdiction.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode("heatmap")}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all hover:-translate-y-0.5"
            >
              <BarChart3 className="w-5 h-5 text-purple-500" />
              {t("heatmap")}
            </button>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-brand-600 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Create Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-3 p-1.5 bg-gray-50/50 rounded-2xl border border-gray-100 w-fit">
            {severityTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSeverityChange(tab.id)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  severityFilter === tab.id
                    ? "bg-brand-100 text-brand-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all w-full md:w-[300px] shadow-sm"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <Loading />
        ) : (
          <CrimeReportList
            reports={crimeReports}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
            onPublish={handlePublish}
            onDelete={handleDelete}
            userRole={user.role}
          />
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
            <p className="text-sm font-bold text-gray-400">
              Showing {rangeStart}–{rangeEnd} of {totalElements} entries
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                      p === currentPage
                        ? "bg-brand-500 text-white shadow-md"
                        : "text-gray-400 hover:bg-gray-50",
                    )}
                  >
                    {p + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
