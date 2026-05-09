"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { MissingPerson } from "@/types";
import { MissingPersonList } from "@/components/missing-persons/MissingPersonList";
import { toast } from "sonner";
import { PageTransition } from "@/components/animations/PageTransition";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useDebouncedCallback } from "use-debounce";
import {
  criminalReportsService,
  MissingPersonReportResponse,
} from "@/services/criminalReportsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PAGE_SIZE = 10;

type StatusTab = "ALL" | "PUBLISHED" | "PENDING" | "RESOLVED";

function mapResponseToLocal(item: MissingPersonReportResponse): MissingPerson {
  return {
    id: item.id,
    title: item.title,
    fullName: item.fullName,
    personalId: item.personalId,
    photo: item.photo,
    date: item.date,
    content: item.content,
    contentDocId: item.contentDocId,
    contactEmail: item.contactEmail,
    contactPhone: item.contactPhone,
    createdAt: item.createdAt,
    userId: item.userId,
    status: item.status as MissingPerson["status"],
    reporterId: item.reporterId,
    isPublic: item.isPublic,
  };
}

export default function MissingPersonsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const t = useTranslations("missingPersons");

  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [searchTitle, setSearchTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    criminalReportsService
      .listMissingPersonReports({
        status: activeTab !== "ALL" ? activeTab : undefined,
        title: searchTitle.trim() || undefined,
        isPublic: false,
        page: currentPage,
        size: PAGE_SIZE,
      })
      .then((response) => {
        if (cancelled) return;
        setMissingPersons(response.content.map(mapResponseToLocal));
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load missing person reports");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, currentPage, activeTab, searchTitle, refreshKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const debouncedSetTitle = useDebouncedCallback((value: string) => {
    setCurrentPage(0);
    setSearchTitle(value);
  }, 400);

  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  const handleCreateNew = useCallback(() => {
    router.push("/dashboard/missing-persons/create");
  }, [router]);

  const handleViewDetail = useCallback(
    (person: MissingPerson) => {
      router.push(`/dashboard/missing-persons/${person.id}`);
    },
    [router],
  );

  const handlePublish = useCallback(
    async (id: string) => {
      const person = missingPersons.find((p) => p.id === id);
      if (!person) return;
      try {
        await criminalReportsService.publishMissingPersonReport(id);
        setMissingPersons((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "PUBLISHED" as const } : p,
          ),
        );
        toast.success(t("toastPublished"));
        addNotification({
          type: "missing-person",
          title: "Missing person report published",
          description: `${person.fullName} is now public and visible to users`,
          reportId: person.id,
        });
      } catch {
        toast.error(t("toastPublishError"));
      }
    },
    [missingPersons, addNotification, t],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const person = missingPersons.find((p) => p.id === id);
      if (!person) return;
      try {
        await criminalReportsService.deleteMissingPersonReport(id);
        toast.success(t("toastDeleted"));
        addNotification({
          type: "missing-person",
          title: "Missing person report deleted",
          description: `${person.fullName} report has been removed`,
          reportId: person.id,
        });
        setRefreshKey((k) => k + 1);
      } catch {
        toast.error(t("toastDeleteError"));
      }
    },
    [missingPersons, addNotification, t],
  );

  if (!user) return null;

  const tabs: { id: StatusTab; label: string }[] = [
    { id: "ALL",       label: "All Reports"   },
    { id: "PUBLISHED", label: "Active Search" },
    { id: "PENDING",   label: "Pending"       },
    { id: "RESOLVED",  label: "Found"         },
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Missing Person Reports
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Manage and track active search operations.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-brand-600 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create New Report
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-3 p-1.5 bg-gray-50/50 rounded-2xl border border-gray-100 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id
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
              onChange={(e) => debouncedSetTitle(e.target.value)}
              className="pl-11 pr-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all w-full md:w-[300px] shadow-sm"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <Loading />
        ) : (
          <MissingPersonList
            persons={missingPersons}
            onViewDetail={handleViewDetail}
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
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}
                className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
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
                onClick={() => setCurrentPage((p) => p + 1)}
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
