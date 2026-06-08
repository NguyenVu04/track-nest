"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { CrimeReport } from "@/types";
import { CrimeReportForm } from "@/components/crime-reports/CrimeReportForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function CreateCrimeReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const t = useTranslations("crimeReports");

  if (!user) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">{t("unauthorizedHeading")}</h2>
        <p className="text-gray-600 mb-4">
          {t("unauthorizedMessage")}
        </p>
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-700"
        >
          {t("goBack")}
        </button>
      </div>
    );
  }

  const handleSave = (report: CrimeReport) => {
    toast.success(t("toastCreated"));
    addNotification({
      type: "crime",
      title: t("notifCreatedTitle"),
      description: report.title,
      reportId: report.id,
    });
    router.push("/dashboard/crime-reports");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("breadcrumbParent"), href: "/dashboard/crime-reports" },
          { label: t("newReport") },
        ]}
      />
      <CrimeReportForm
        report={null}
        onSave={handleSave}
        onCancel={handleCancel}
        mode="create"
      />
    </>
  );
}
