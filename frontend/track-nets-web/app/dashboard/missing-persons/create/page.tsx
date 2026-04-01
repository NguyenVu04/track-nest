"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { MissingPerson } from "@/types";
import { MissingPersonForm } from "@/components/missing-persons/MissingPersonForm";
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

export default function CreateMissingPersonPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [missingPersons, setMissingPersons] =
    useState<MissingPerson[]>(mockMissingPersons);

  if (!user || user.role !== "Reporter") {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Unauthorized</h2>
        <p className="text-gray-600 mb-4">
          You do not have permission to create missing person reports.
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

  const handleSave = (person: MissingPerson) => {
    setMissingPersons([...missingPersons, person]);
    toast.success("Missing person report created");
    router.push("/dashboard/missing-persons");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <MissingPersonForm
      person={null}
      onSave={handleSave}
      onCancel={handleCancel}
      mode="create"
    />
  );
}
