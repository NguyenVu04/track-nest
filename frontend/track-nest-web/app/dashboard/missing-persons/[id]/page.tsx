"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { MissingPerson } from "@/types";
import { MissingPersonDetail } from "@/components/missing-persons/MissingPersonDetail";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";

// Mock data
const mockMissingPersons: MissingPerson[] = [
  {
    id: "1",
    title: "Missing Person - Sarah Johnson",
    fullName: "Sarah Johnson",
    personalId: "DL-123456",
    date: "2026-01-02T14:30:00Z",
    content: "Brown hair, blue eyes, 5'6\" tall, wearing a red jacket. Last seen at Central Park.",
    createdAt: "2026-01-02T16:00:00Z",
    userId: "user-1",
    reporterId: "user-1",
    status: "PENDING",
    isPublic: true,
  },
  {
    id: "2",
    title: "Missing Person - David Martinez",
    fullName: "David Martinez",
    personalId: "DL-789012",
    date: "2026-01-03T08:15:00Z",
    content: "Black hair, brown eyes, 5'8\" tall, wearing school uniform. Last seen at Downtown Metro Station.",
    createdAt: "2026-01-03T10:00:00Z",
    userId: "user-2",
    reporterId: "user-2",
    status: "PUBLISHED",
    isPublic: true,
  },
  {
    id: "3",
    title: "Missing Person - Emily Chen",
    fullName: "Emily Chen",
    personalId: "DL-345678",
    date: "2026-01-01T18:45:00Z",
    content: "Long black hair, brown eyes, 5'4\" tall. Last seen in business attire at Financial District.",
    createdAt: "2026-01-02T09:00:00Z",
    userId: "user-3",
    reporterId: "user-3",
    status: "PUBLISHED",
    isPublic: true,
  },
];

export default function MissingPersonDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [missingPersons, setMissingPersons] =
    useState<MissingPerson[]>(mockMissingPersons);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const { id } = useParams();

  const selectedPerson = missingPersons.find((p) => p.id === id);

  if (!user) return null;

  if (isLoading) {
    return <Loading />;
  }

  if (!selectedPerson) {
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

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const handlePublish = async (id: string) => {
    const person = missingPersons.find((p) => p.id === id);
    if (!person) return;
    try {
      await mockRequest(false);
      setMissingPersons(
        missingPersons.map((p) =>
          p.id === id ? { ...p, status: "PUBLISHED" as const } : p,
        ),
      );
      toast.success("Report published successfully");
      addNotification({
        type: "missing-person",
        title: "Missing person report published",
        description: `${person.fullName} is now public and visible to users`,
        reportId: person.id,
      });
    } catch (error) {
      toast.error("Lỗi khi đăng tải báo cáo");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const person = missingPersons.find((p) => p.id === id);
    if (!person) return;
    try {
      await mockRequest(false);
      setMissingPersons(missingPersons.filter((p) => p.id !== id));
      toast.success("Thành công");
      addNotification({
        type: "missing-person",
        title: "Missing person report deleted",
        description: `${person.fullName} report has been removed`,
        reportId: person.id,
      });
      router.push("/dashboard/missing-persons");
    } catch (error) {
      toast.error("Lỗi khi xóa báo cáo");
      console.error(error);
    }
  };

  const handleEdit = (person: MissingPerson) => {
    router.push(`/dashboard/missing-persons/${person.id}/edit`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <MissingPersonDetail
      person={selectedPerson}
      onBack={handleBack}
      onEdit={handleEdit}
      onPublish={handlePublish}
      onDelete={handleDelete}
      userRole={user.role}
    />
  );
}
