"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { CrimeReport } from "@/types";
import { CrimeReportForm } from "@/components/crime-reports/CrimeReportForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { toast } from "sonner";

export default function CreateCrimeReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  if (!user) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Unauthorized</h2>
        <p className="text-gray-600 mb-4">
          You do not have permission to create crime reports.
        </p>
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const handleSave = (report: CrimeReport) => {
    toast.success("Report created successfully");
    addNotification({
      type: "crime",
      title: "Crime report created",
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
          { label: "Crime Reports", href: "/dashboard/crime-reports" },
          { label: "New Report" },
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
