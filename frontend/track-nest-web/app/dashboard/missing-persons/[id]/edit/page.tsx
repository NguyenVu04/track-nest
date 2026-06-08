"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { MissingPerson } from "@/types";
import { MissingPersonForm } from "@/components/missing-persons/MissingPersonForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";
import { useTranslations } from "next-intl";

export default function EditMissingPersonPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const t = useTranslations("missingPersons");

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
        if (contentValue) {
          try {
            if (
              !contentValue.trim().startsWith("<") &&
              !contentValue.startsWith("http")
            ) {
              contentValue = await criminalReportsService.getFileContent(
                "criminal-reports",
                contentValue,
              );
            } else if (contentValue.startsWith("http")) {
              const contentResponse = await fetch(contentValue);
              contentValue = await contentResponse.text();
            }
          } catch (error) {
            console.error("Failed to resolve report content:", error);
          }
        }
        setPerson({
          id: response.id,
          title: response.title,
          fullName: response.fullName,
          personalId: response.personalId,
          photo: response.photo
            ? criminalReportsService.getMissingPersonPhotoUrl(response.id)
            : "",
          date: response.date,
          content: contentValue,
          contentDocId: response.contentDocId,
          latitude: response.latitude,
          longitude: response.longitude,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          createdAt: response.createdAt,
          userId: response.userId,
          status: response.status as MissingPerson["status"],
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

  const handleSave = (updated: MissingPerson) => {
    toast.success(t("toastUpdated"));
    router.push(`/dashboard/missing-persons/${updated.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("breadcrumbParent"), href: "/dashboard/missing-persons" },
          { label: person.fullName, href: `/dashboard/missing-persons/${person.id}` },
          { label: t("breadcrumbEdit") },
        ]}
      />
      <MissingPersonForm
        person={person}
        onSave={handleSave}
        onCancel={handleCancel}
        mode="edit"
      />
    </>
  );
}
