"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import type { MissingPerson, UserRole } from "@/types";
import { MissingPersonList } from "./MissingPersonList";
import { MissingPersonDetail } from "./MissingPersonDetail";
import { MissingPersonForm } from "./MissingPersonForm";
import { useTranslations } from "next-intl";
import { criminalReportsService } from "@/services/criminalReportsService";
import { toast } from "sonner";

interface MissingPersonDashboardProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole[];
  };
}

type ViewMode = "list" | "detail" | "create" | "edit";

export function MissingPersonDashboard({ user }: MissingPersonDashboardProps) {
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");


  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await criminalReportsService.listMissingPersonReports({ page: 0, size: 100 });
      setMissingPersons(response.content);
    } catch {
      toast.error("Failed to load missing person reports");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewDetail = (person: MissingPerson) => {
    setSelectedPerson(person);
    setViewMode("detail");
  };

  const handleCreateNew = () => {
    setSelectedPerson(null);
    setViewMode("create");
  };

  const handleEdit = (person: MissingPerson) => {
    setSelectedPerson(person);
    setViewMode("edit");
  };

  const handleSave = (person: MissingPerson) => {
    if (viewMode === "create") {
      setMissingPersons([...missingPersons, person]);
    } else {
      setMissingPersons(
        missingPersons.map((p) => (p.id === person.id ? person : p)),
      );
    }
    setViewMode("list");
  };

  const handlePublish = async (id: string) => {
    try {
      const updated = await criminalReportsService.publishMissingPersonReport(id);
      setMissingPersons((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch {
      toast.error("Failed to publish report");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await criminalReportsService.deleteMissingPersonReport(id);
      setMissingPersons((prev) => prev.filter((p) => p.id !== id));
      if (selectedPerson?.id === id) setViewMode("list");
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedPerson(null);
  };

  const filteredPersons = missingPersons.filter((person) => {
    const matchesSearch =
      person.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (viewMode === "detail" && selectedPerson) {
    return (
      <MissingPersonDetail
        person={selectedPerson}
        onBack={handleBackToList}
        onEdit={handleEdit}
        onPublish={handlePublish}
        onDelete={handleDelete}
        userRole={user.role}
      />
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <MissingPersonForm
        person={selectedPerson}
        onSave={handleSave}
        onCancel={handleBackToList}
        mode={viewMode}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse">Loading reports...</p>
      </div>
    );
  }

  return (
    <MissingPersonList
      persons={filteredPersons}
      onViewDetail={handleViewDetail}
      onPublish={handlePublish}
      onDelete={handleDelete}
      userRole={user.role}
    />
  );
}
