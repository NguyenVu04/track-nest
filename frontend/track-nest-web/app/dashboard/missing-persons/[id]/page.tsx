"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { MissingPerson } from "@/types";
import { MissingPersonDetail } from "@/components/missing-persons/MissingPersonDetail";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";

export default function MissingPersonDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { id } = useParams<{ id: string }>();

  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const response = await criminalReportsService.getMissingPersonReport(id);
        setPerson({
          id: response.id,
          title: response.title,
          fullName: response.fullName,
          personalId: response.personalId,
          photo: response.photo,
          date: response.date,
          content: response.content,
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
        toast.error("Failed to load report");
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
        <h2 className="text-xl font-semibold mb-4">Missing Person Not Found</h2>
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const handlePublish = async (reportId: string) => {
    try {
      const response = await criminalReportsService.publishMissingPersonReport(reportId);
      setPerson((prev) =>
        prev ? { ...prev, status: response.status as MissingPerson["status"], isPublic: response.isPublic } : prev,
      );
      toast.success("Report published successfully");
      addNotification({
        type: "missing-person",
        title: "Missing person report published",
        description: `${person.fullName} is now public and visible to users`,
        reportId: person.id,
      });
    } catch (error) {
      toast.error("Failed to publish report");
      console.error(error);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await criminalReportsService.deleteMissingPersonReport(reportId);
      toast.success("Report deleted successfully");
      addNotification({
        type: "missing-person",
        title: "Missing person report deleted",
        description: `${person.fullName} report has been removed`,
        reportId: person.id,
      });
      router.push("/dashboard/missing-persons");
    } catch (error) {
      toast.error("Failed to delete report");
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
    <MissingPersonDetail
      person={person}
      onBack={handleBack}
      onEdit={handleEdit}
      onPublish={handlePublish}
      onDelete={handleDelete}
      userRole={user.role}
    />
  );
}
