"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { CrimeReport } from "@/types";
import { CrimeReportForm } from "@/components/crime-reports/CrimeReportForm";
import { toast } from "sonner";
import {
  criminalReportsService,
  CreateCrimeReportRequest,
} from "@/services/criminalReportsService";

export default function CreateCrimeReportPage() {
  const router = useRouter();
  const { user } = useAuth();

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

  const handleSave = async (report: CrimeReport) => {
    const request: CreateCrimeReportRequest = {
      title: report.title,
      content: report.content,
      severity: report.severity,
      date: report.date,
      longitude: report.longitude,
      latitude: report.latitude,
      numberOfVictims: report.numberOfVictims,
      numberOfOffenders: report.numberOfOffenders,
      arrested: report.arrested,
      photos: report.photos,
    };
    await criminalReportsService.createCrimeReport(request);
    toast.success("Report created successfully");
    router.push("/dashboard/crime-reports");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <CrimeReportForm
      report={null}
      onSave={handleSave}
      onCancel={handleCancel}
      mode="create"
    />
  );
}
