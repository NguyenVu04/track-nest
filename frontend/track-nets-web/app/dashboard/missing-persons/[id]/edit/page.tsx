"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { MissingPerson } from "@/types";
import { MissingPersonForm } from "@/components/missing-persons/MissingPersonForm";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";

// Mock data
const mockMissingPersons: MissingPerson[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    age: 28,
    gender: "Female",
    description: "Brown hair, blue eyes, 5'6\" tall, wearing a red jacket",
    lastSeenLocation: "Central Park, New York",
    lastSeenDate: "2026-01-02T14:30:00Z",
    coordinates: [40.7829, -73.9654],
    status: "Unhandled",
    reportedBy: "Mike Johnson",
    reportedDate: "2026-01-02T16:00:00Z",
    contactInfo: "+1 (555) 123-4567",
  },
  {
    id: "2",
    name: "David Martinez",
    age: 16,
    gender: "Male",
    description: "Black hair, brown eyes, 5'8\" tall, wearing school uniform",
    lastSeenLocation: "Downtown Metro Station",
    lastSeenDate: "2026-01-03T08:15:00Z",
    coordinates: [40.758, -73.9855],
    status: "Published",
    reportedBy: "Maria Martinez",
    reportedDate: "2026-01-03T10:00:00Z",
    contactInfo: "+1 (555) 987-6543",
  },
  {
    id: "3",
    name: "Emily Chen",
    age: 35,
    gender: "Female",
    description:
      "Long black hair, brown eyes, 5'4\" tall, last seen in business attire",
    lastSeenLocation: "Financial District",
    lastSeenDate: "2026-01-01T18:45:00Z",
    coordinates: [40.7074, -74.0113],
    status: "Published",
    reportedBy: "James Chen",
    reportedDate: "2026-01-02T09:00:00Z",
    contactInfo: "+1 (555) 456-7890",
  },
];

export default function EditMissingPersonPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [missingPersons, setMissingPersons] =
    useState<MissingPerson[]>(mockMissingPersons);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

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

  const handleSave = (person: MissingPerson) => {
    setMissingPersons(
      missingPersons.map((p) => (p.id === person.id ? person : p)),
    );
    toast.success("Missing person report updated");
    router.push(`/dashboard/missing-persons/${person.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <MissingPersonForm
      person={selectedPerson}
      onSave={handleSave}
      onCancel={handleCancel}
      mode="edit"
    />
  );
}
