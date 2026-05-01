"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
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
  PageResponse,
} from "@/services/criminalReportsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations } from "next-intl";

export default function MissingPersonsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");

  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const debouncedSetSearch = useDebouncedCallback(
    (value: string) => setSearchQuery(value),
    300,
  );

  const handleViewDetail = useCallback(
    (person: MissingPerson) => {
      router.push(`/dashboard/missing-persons/${person.id}`);
    },
    [router],
  );

  const handleCreateNew = useCallback(() => {
    router.push("/dashboard/missing-persons/create");
  }, [router]);

  const handlePublish = useCallback(
    async (id: string) => {
      const person = missingPersons.find((p) => p.id === id);
      if (!person) return;
      try {
        await criminalReportsService.publishMissingPersonReport(id);
        setMissingPersons(
          missingPersons.map((p) =>
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
      } catch (error) {
        toast.error(t("toastPublishError"));
        console.error(error);
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
        setMissingPersons(missingPersons.filter((p) => p.id !== id));
        toast.success(t("toastDeleted"));
        addNotification({
          type: "missing-person",
          title: "Missing person report deleted",
          description: `${person.fullName} report has been removed`,
          reportId: person.id,
        });
      } catch (error) {
        toast.error(t("toastDeleteError"));
        console.error(error);
      }
    },
    [missingPersons, addNotification, t],
  );

  const filteredPersons = useMemo(() => {
    const getSearchableContent = (value: string) => {
      if (!value) return "";
      const trimmed = value.trim();
      if (trimmed.startsWith("<")) return trimmed;
      if (trimmed.startsWith("http") || trimmed.endsWith(".html")) return "";
      return trimmed;
    };

    return missingPersons.filter((person) => {
      const matchesSearch =
        person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSearchableContent(person.content || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || person.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [missingPersons, searchQuery, statusFilter]);

  useEffect(() => {
    const fetchMissingPersons = async () => {
      try {
        setIsLoading(true);
        const response: PageResponse<MissingPersonReportResponse> =
          await criminalReportsService.listMissingPersonReports({
            isPublic: false,
            page: 0,
            size: 100,
          });

        const mappedPersons: MissingPerson[] = response.content.map((item) => ({
          id: item.id,
          title: item.title,
          fullName: item.fullName,
          personalId: item.personalId,
          photo: item.photo,
          date: item.date,
          content: item.content,
          contactEmail: item.contactEmail,
          contactPhone: item.contactPhone,
          createdAt: item.createdAt,
          userId: item.userId,
          status: item.status as MissingPerson["status"],
          reporterId: item.reporterId,
          isPublic: item.isPublic,
        }));

        setMissingPersons(mappedPersons);
      } catch (error) {
        console.error("Error fetching missing persons:", error);
        toast.error("Failed to load missing person reports");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchMissingPersons();
    }
  }, [user]);

  if (!user) return null;

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <PageTransition>
      <div>
        <Breadcrumbs items={[{ label: t("pageTitle") }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-gray-900 text-xl font-semibold">
            {t("pageTitle")}
          </h2>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("newReport")}
          </button>
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent appearance-none"
              >
                <option value="all">{t("filterAll")}</option>
                <option value="PENDING">{t("filterPending")}</option>
                <option value="PUBLISHED">{t("filterPublished")}</option>
                <option value="REJECTED">{t("filterRejected")}</option>
              </select>
            </div>
          </div>
        </div>

        <MissingPersonList
          persons={filteredPersons}
          onViewDetail={handleViewDetail}
          onPublish={handlePublish}
          onDelete={handleDelete}
          userRole={user.role}
        />
      </div>
    </PageTransition>
  );
}
