import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { MissingPerson, UserRole } from "@/types";
import { MissingPersonList } from "./MissingPersonList";
import { MissingPersonDetail } from "./MissingPersonDetail";
import { MissingPersonForm } from "./MissingPersonForm";
import { useTranslations } from "next-intl";

interface MissingPersonDashboardProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole[];
  };
}

type ViewMode = "list" | "detail" | "create" | "edit";

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

export function MissingPersonDashboard({ user }: MissingPersonDashboardProps) {
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");

  const [missingPersons, setMissingPersons] =
    useState<MissingPerson[]>(mockMissingPersons);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handlePublish = (id: string) => {
    setMissingPersons(
      missingPersons.map((p) =>
        p.id === id ? { ...p, status: "PUBLISHED" } : p,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setMissingPersons(missingPersons.filter((p) => p.id !== id));
    if (selectedPerson?.id === id) {
      setViewMode("list");
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-gray-900">{t("pageTitle")}</h2>
        {/* {user.role === "Reporter" && ( */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("newReport")}
          </button>
        {/* )} */}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={tCommon("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <MissingPersonList
        persons={filteredPersons}
        onViewDetail={handleViewDetail}
        onPublish={handlePublish}
        onDelete={handleDelete}
        userRole={user.role}
      />
    </div>
  );
}
