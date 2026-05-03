"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { CrimeReport } from "@/types";
import { CrimeReportDetail } from "@/components/crime-reports/CrimeReportDetail";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";

export default function CrimeReportDetailPage() {
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
        if (
          contentValue &&
          !contentValue.trim().startsWith("<") &&
          !contentValue.startsWith("http")
        ) {
          try {
            contentValue = await criminalReportsService.getFileUrl(
              "criminal-reports",
              contentValue,
            );
          } catch (error) {
            console.error("Failed to resolve report content URL:", error);
          }
        }
        const resolvedPhotos = await Promise.all(
          (response.photos ?? []).map(async (photo) => {
            if (!photo || photo.startsWith("http")) return photo;
            try {
              return await criminalReportsService.getFileUrl(
                "criminal-reports",
                photo,
              );
            } catch (error) {
              console.error("Failed to resolve photo URL:", error);
              return photo;
            }
          }),
        );
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

  const handleEdit = (r: CrimeReport) => {
    router.push(`/dashboard/crime-reports/${r.id}/edit`);
  };

  const handlePublish = async (reportId: string) => {
    try {
      await criminalReportsService.publishCrimeReport(reportId);
      setReport((prev) => (prev ? { ...prev, isPublic: true } : prev));
      toast.success("Report published successfully");
    } catch (error) {
      toast.error("Error publishing report");
      console.error(error);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await criminalReportsService.deleteCrimeReport(reportId);
      toast.success("Report deleted successfully");
      router.push("/dashboard/crime-reports");
    } catch (error) {
      toast.error("Failed to delete crime report");
      console.error(error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <CrimeReportDetail
      report={report}
      onBack={handleBack}
      onEdit={handleEdit}
      onPublish={handlePublish}
      onDelete={handleDelete}
      userRole={user.role}
    />
  );
}
