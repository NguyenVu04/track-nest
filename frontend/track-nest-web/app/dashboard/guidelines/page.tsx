"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Eye, MoreVertical, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Guideline } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";
import { PageTransition } from "@/components/animations/PageTransition";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useDebouncedCallback } from "use-debounce";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PAGE_SIZE = 10;

type StatusFilter = "all" | "published" | "draft";

function toIsPublic(filter: StatusFilter): boolean | undefined {
  if (filter === "published") return true;
  if (filter === "draft") return false;
  return undefined;
}

export default function GuidelinesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTitle, setSearchTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    criminalReportsService
      .listGuidelinesDocuments({
        isPublic: toIsPublic(statusFilter),
        title: searchTitle.trim() || undefined,
        page: currentPage,
        size: PAGE_SIZE,
      })
      .then((response) => {
        if (cancelled) return;
        setGuidelines(
          response.content.map((item) => ({
            id: item.id,
            title: item.title,
            abstractText: item.abstractText,
            content: item.content,
            contentDocId: item.contentDocId,
            createdAt: item.createdAt,
            reporterId: item.reporterId,
            isPublic: item.isPublic,
          })),
        );
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      })
      .catch(() => { if (!cancelled) toast.error("Failed to load guidelines"); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [user, statusFilter, searchTitle, currentPage, refreshKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const debouncedSetTitle = useDebouncedCallback((value: string) => {
    setCurrentPage(0);
    setSearchTitle(value);
  }, 400);

  const handleStatusChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setCurrentPage(0);
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      await criminalReportsService.deleteGuidelinesDocument(id);
      setConfirmDelete(null);
      toast.success("Guideline deleted");
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error("Failed to delete guideline");
      console.error(error);
    }
  }, []);

  if (!user) return null;

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: "all",       label: "All Guides" },
    { id: "published", label: "Published" },
    { id: "draft",     label: "Drafts" },
  ];

  const rangeStart    = totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const rangeEnd      = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);
  const pageNumbers: number[] = [];
  const windowSize    = 5;
  let winStart        = Math.max(0, currentPage - Math.floor(windowSize / 2));
  const winEnd        = Math.min(totalPages - 1, winStart + windowSize - 1);
  if (winEnd - winStart < windowSize - 1) winStart = Math.max(0, winEnd - windowSize + 1);
  for (let i = winStart; i <= winEnd; i++) pageNumbers.push(i);

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto pb-12">
        <Breadcrumbs items={[{ label: "Safety Guidelines" }]} />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Safety Guidelines</h1>
            <p className="text-gray-500 mt-2 text-lg">Manage and update your family&apos;s safety protocols and emergency checklists.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/guidelines/create")}
            className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-brand-600 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create New Guideline
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] p-3 mb-10 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  statusFilter === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                {statusFilter === tab.id && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text"
              placeholder="Search guidelines…"
              onChange={(e) => debouncedSetTitle(e.target.value)}
              className="pl-11 pr-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-900 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all w-full md:w-[260px] shadow-sm"
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guidelines.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                <FileText className="w-16 h-16 text-gray-100 mb-4" />
                <p className="text-gray-400 font-bold">No guidelines found in this section</p>
              </div>
            ) : (
              guidelines.map((guideline, idx) => {
                const isDraft = !guideline.isPublic;
                const isFeatured = idx === 0 && !searchTitle;
                return (
                  <div
                    key={guideline.id}
                    className={cn(
                      "group relative bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col",
                      isFeatured && "md:col-span-2 lg:col-span-2",
                    )}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        isDraft ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-green-50 text-green-500 border-green-100",
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", isDraft ? "bg-gray-300" : "bg-green-500")} />
                        {isDraft ? "Draft" : "Published"}
                      </div>
                      <button
                        aria-label="Delete guideline"
                        onClick={() => setConfirmDelete(guideline.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-black text-gray-900 leading-tight mb-3 group-hover:text-brand-500 transition-colors",
                        isFeatured ? "text-2xl" : "text-xl",
                      )}>
                        {guideline.title}
                      </h3>
                      <p className="text-gray-500 font-medium line-clamp-3 leading-relaxed mb-8">
                        {guideline.abstractText}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-gray-50">
                      <p className="text-xs font-bold text-gray-400">
                        {new Date(guideline.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2">
                        {isDraft ? (
                          <button
                            onClick={() => router.push(`/dashboard/guidelines/${guideline.id}`)}
                            className="text-sm font-black text-brand-600 hover:text-brand-700 flex items-center gap-1 group/btn"
                          >
                            Continue
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        ) : (
                          <>
                            <button
                              aria-label="View guideline"
                              onClick={() => router.push(`/dashboard/guidelines/${guideline.id}`)}
                              className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-500 transition-all"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              aria-label="Edit guideline"
                              onClick={() => router.push(`/dashboard/guidelines/${guideline.id}/edit`)}
                              className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-500 transition-all"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
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
                      p === currentPage ? "bg-brand-500 text-white shadow-md" : "text-gray-400 hover:bg-gray-50",
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

      {confirmDelete && (
        <ConfirmModal
          title="Delete Guideline"
          message="Are you sure you want to delete this guideline? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </PageTransition>
  );
}
