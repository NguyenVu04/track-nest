"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { MissingPerson } from "@/types";
import { MissingPersonForm } from "@/components/missing-persons/MissingPersonForm";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";

export default function EditMissingPersonPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

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

  const handleSave = (updated: MissingPerson) => {
    toast.success("Missing person report updated");
    router.push(`/dashboard/missing-persons/${updated.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <MissingPersonForm
      person={person}
      onSave={handleSave}
      onCancel={handleCancel}
      mode="edit"
    />
  );
}
