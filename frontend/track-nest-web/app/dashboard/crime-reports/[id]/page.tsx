"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { CrimeReport } from "@/types";
import { CrimeReportDetail } from "@/components/crime-reports/CrimeReportDetail";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";
import { useTranslations } from "next-intl";

export default function CrimeReportDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const t = useTranslations("crimeReports");

  const [report, setReport] = useState<CrimeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const response = await criminalReportsService.getCrimeReport(id);
        let contentValue = response.content;
        if (
          contentValue &&
          !contentValue.trim().startsWith("<") &&
          !contentValue.startsWith("http")
        ) {
          try {
            contentValue = await criminalReportsService.getFileContent(
              "criminal-reports",
              contentValue,
            );
          } catch (error) {
            console.error("Failed to resolve report content URL:", error);
          }
        }
        const resolvedPhotos =
          response?.photos?.map((photo) =>
            criminalReportsService.getCrimeReportPhotoUrl(response.id, photo),
          ) || [];

        setReport({
          id: response.id,
          title: response.title,
          content: contentValue,
          contentDocId: response.content,
          severity: response.severity as CrimeReport["severity"],
          date: response.date,
          longitude: response.longitude,
          latitude: response.latitude,
          numberOfVictims: response.numberOfVictims,
          numberOfOffenders: response.numberOfOffenders,
          arrested: response.arrested,
          photos: resolvedPhotos,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      } catch (error) {
        console.error("Failed to fetch crime report:", error);
        toast.error(t("toastLoadReportError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [user, id]);

  if (!user) return null;

  if (isLoading) return <Loading />;

  if (!report) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">{t("notFound")}</h2>
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-700"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  const handleEdit = (r: CrimeReport) => {
    router.push(`/dashboard/crime-reports/${r.id}/edit`);
  };

  const handlePublish = async (reportId: string) => {
    try {
      await criminalReportsService.publishCrimeReport(reportId);
      setReport((prev) => (prev ? { ...prev, isPublic: true } : prev));
      toast.success(t("toastPublished"));
      if (report) {
        addNotification({
          type: "crime",
          title: t("notifPublishedTitle"),
          description: t("notifPublishedDesc", { title: report.title }),
          reportId: report.id,
        });
      }
    } catch (error) {
      toast.error(t("toastPublishError"));
      console.error(error);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await criminalReportsService.deleteCrimeReport(reportId);
      toast.success(t("toastDeleted"));
      if (report) {
        addNotification({
          type: "crime",
          title: t("notifDeletedTitle"),
          description: t("notifDeletedDesc", { title: report.title }),
          reportId: report.id,
        });
      }
      router.push("/dashboard/crime-reports");
    } catch (error) {
      toast.error(t("toastDeleteError"));
      console.error(error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("breadcrumbParent"), href: "/dashboard/crime-reports" },
          { label: report.title },
        ]}
      />
      <CrimeReportDetail
        report={report}
        onBack={handleBack}
        onEdit={handleEdit}
        onPublish={handlePublish}
        onDelete={handleDelete}
        userRole={user.role}
      />
    </>
  );
}
