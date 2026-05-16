"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { CrimeReport } from "@/types";
import { CrimeReportForm } from "@/components/crime-reports/CrimeReportForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import {
  criminalReportsService,
  UpdateCrimeReportRequest,
} from "@/services/criminalReportsService";

export default function EditCrimeReportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [report, setReport] = useState<CrimeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const response = await criminalReportsService.getCrimeReport(id);
        let contentValue = response.content;
        if (contentValue) {
          try {
            let contentUrl = contentValue;
            if (
              !contentUrl.trim().startsWith("<") &&
              !contentUrl.startsWith("http")
            ) {
              contentUrl = await criminalReportsService.getFileUrl(
                "criminal-reports",
                contentUrl,
              );
            }
            if (contentUrl.startsWith("http")) {
              const contentResponse = await fetch(contentUrl);
              contentValue = await contentResponse.text();
            }
          } catch (error) {
            console.error("Failed to resolve report content:", error);
          }
        }
        setReport({
          id: response.id,
          title: response.title,
          content: contentValue,
          contentDocId: response.contentDocId,
          severity: response.severity as CrimeReport["severity"],
          date: response.date,
          longitude: response.longitude,
          latitude: response.latitude,
          numberOfVictims: response.numberOfVictims,
          numberOfOffenders: response.numberOfOffenders,
          arrested: response.arrested,
          photos: response.photos ?? [],
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      } catch (error) {
        console.error("Failed to fetch crime report:", error);
        toast.error("Failed to load crime report");
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
        <h2 className="text-xl font-semibold mb-4">Crime Report Not Found</h2>
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const handleSave = async (updated: CrimeReport) => {
    const request: UpdateCrimeReportRequest = {
      title: updated.title,
      content: updated.content,
      severity: updated.severity,
      date: updated.date,
      numberOfVictims: updated.numberOfVictims,
      numberOfOffenders: updated.numberOfOffenders,
      arrested: updated.arrested,
      photos: updated.photos,
    };
    await criminalReportsService.updateCrimeReport(id, request);
    toast.success("Report updated successfully");
    router.push(`/dashboard/crime-reports/${id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Crime Reports", href: "/dashboard/crime-reports" },
          { label: report.title, href: `/dashboard/crime-reports/${report.id}` },
          { label: "Edit" },
        ]}
      />
      <CrimeReportForm
        report={report}
        onSave={handleSave}
        onCancel={handleCancel}
        mode="edit"
      />
    </>
  );
}
