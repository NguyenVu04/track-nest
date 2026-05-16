"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { MissingPerson } from "@/types";
import { MissingPersonForm } from "@/components/missing-persons/MissingPersonForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { toast } from "sonner";

export default function CreateMissingPersonPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
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

  const handleSave = (_person: MissingPerson) => {
    toast.success("Missing person report created");
    router.push("/dashboard/missing-persons");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Missing Persons", href: "/dashboard/missing-persons" },
          { label: "New Report" },
        ]}
      />
      <MissingPersonForm
        person={null}
        onSave={handleSave}
        onCancel={handleCancel}
        mode="create"
      />
    </>
  );
}
