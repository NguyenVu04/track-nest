"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { MissingPerson } from "@/types";
import { MissingPersonList } from "@/components/MissingPersonList";
import { MissingPersonDetail } from "@/components/MissingPersonDetail";
import { MissingPersonForm } from "@/components/MissingPersonForm";

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

type ViewMode = "list" | "detail" | "create" | "edit";

export default function MissingPersonsPage() {
  const { user } = useAuth();
  const [missingPersons, setMissingPersons] =
    useState<MissingPerson[]>(mockMissingPersons);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (!user) return null;

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
        missingPersons.map((p) => (p.id === person.id ? person : p))
      );
    }
    setViewMode("list");
  };

  const handlePublish = (id: string) => {
    setMissingPersons(
      missingPersons.map((p) =>
        p.id === id ? { ...p, status: "Published" as const } : p
      )
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
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.lastSeenLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || person.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        <h2 className="text-gray-900 text-xl font-semibold">
          Missing Person Reports
        </h2>
        {user.role === "Reporter" && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="Unhandled">Unhandled</option>
              <option value="Published">Published</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      <MissingPersonList
        persons={filteredPersons}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onPublish={handlePublish}
        onDelete={handleDelete}
        userRole={user.role}
      />
    </div>
  );
}
