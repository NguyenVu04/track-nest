"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Search, Filter, BarChart3, Calendar, ChevronLeft, ChevronRight, ListFilter, SlidersHorizontal } from "lucide-react";
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
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  const handleEdit = useCallback(
    (report: CrimeReport) => {
      router.push(`/dashboard/crime-reports/${report.id}/edit`);
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
        (severityFilter === "high" && report.severity >= 4) ||
        (severityFilter === "medium" && report.severity === 3) ||
        (severityFilter === "low" && report.severity <= 2);

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

  const severityTabs = [
    { id: "all", label: "All Severities" },
    { id: "high", label: "High Priority" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ];

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto pb-12">
        <Breadcrumbs items={[{ label: t("pageTitle") }]} />
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Crime Reports Management</h1>
            <p className="text-gray-500 mt-2 text-lg">Monitor, assign, and resolve active incidents within your jurisdiction.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleViewHeatmap}
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

        {/* Filters Section */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-3 p-1.5 bg-gray-50/50 rounded-2xl border border-gray-100 w-fit">
            {severityTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  severityFilter === tab.id
                    ? "bg-brand-100 text-brand-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  defaultValue={searchQuery}
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                  className="pl-11 pr-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all w-full md:w-[300px] shadow-sm"
                />
             </div>
             
             <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all">
                <Calendar className="w-4 h-4 text-gray-400" />
                Date Range
             </button>
             
             <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                More Filters
             </button>
          </div>
        </div>

        {/* List Section */}
        <CrimeReportList
          reports={filteredReports}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          onPublish={handlePublish}
          onDelete={handleDelete}
          userRole={user.role}
        />

        {/* Pagination Section */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
           <p className="text-sm font-bold text-gray-400">
              Showing 1 to {filteredReports.length} of {crimeReports.length} entries
           </p>
           
           <div className="flex items-center gap-2">
              <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-all" disabled>
                 <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                 {[1, 2, 3].map((page) => (
                    <button
                      key={page}
                      className={cn(
                        "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                        page === 1 ? "bg-brand-500 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"
                      )}
                    >
                       {page}
                    </button>
                 ))}
              </div>
              <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 transition-all">
                 <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>
    </PageTransition>
  );
}
