"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { MissingPerson } from "@/types";
import { MissingPersonDetail } from "@/components/missing-persons/MissingPersonDetail";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";
import { useTranslations } from "next-intl";

export default function MissingPersonDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const t = useTranslations("missingPersons");
  const { id } = useParams<{ id: string }>();

  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const response =
          await criminalReportsService.getMissingPersonReport(id);
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
        const photoUrl = response.photo
          ? criminalReportsService.getMissingPersonPhotoUrl(response.id)
          : "";
        setPerson({
          id: response.id,
          title: response.title,
          fullName: response.fullName,
          personalId: response.personalId,
          photo: photoUrl,
          date: response.date,
          content: contentValue,
          contentDocId: response.content,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          createdAt: response.createdAt,
          userId: response.userId,
          status: response.status as MissingPerson["status"],
          latitude: response.latitude,
          longitude: response.longitude,
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      } catch (error) {
        console.error("Failed to fetch missing person report:", error);
        toast.error(t("toastLoadReportError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [user, id]);

  if (!user) return null;

  if (isLoading) {
    return <Loading />;
  }

  if (!person) {
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

  const handlePublish = async (reportId: string) => {
    try {
      const response =
        await criminalReportsService.publishMissingPersonReport(reportId);
      setPerson((prev) =>
        prev
          ? {
              ...prev,
              status: response.status as MissingPerson["status"],
              isPublic: response.isPublic,
            }
          : prev,
      );
      toast.success(t("toastPublished"));
      if (person) {
        addNotification({
          type: "missing-person",
          title: t("notifPublishedTitle"),
          description: t("notifPublishedDesc", { name: person.fullName }),
          reportId: person.id,
        });
      }
    } catch (error) {
      toast.error(t("toastPublishError"));
      console.error(error);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await criminalReportsService.deleteMissingPersonReport(reportId);
      toast.success(t("toastDeleted"));
      if (person) {
        addNotification({
          type: "missing-person",
          title: t("notifDeletedTitle"),
          description: t("notifDeletedDesc", { name: person.fullName }),
          reportId: person.id,
        });
      }
      router.push("/dashboard/missing-persons");
    } catch (error) {
      toast.error(t("toastDeleteError"));
      console.error(error);
    }
  };

  const handleEdit = (p: MissingPerson) => {
    router.push(`/dashboard/missing-persons/${p.id}/edit`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("breadcrumbParent"), href: "/dashboard/missing-persons" },
          { label: person.fullName },
        ]}
      />
      <MissingPersonDetail
        person={person}
        onBack={handleBack}
        onEdit={handleEdit}
        onPublish={handlePublish}
        onDelete={handleDelete}
        userRole={user.role}
      />
    </>
  );
}
