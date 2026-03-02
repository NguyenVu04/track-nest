"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { MissingPerson } from "@/types";
import { MissingPersonList } from "@/components/missing-persons/MissingPersonList";
import { toast } from "sonner";
import { PageTransition } from "@/components/animations/PageTransition";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useDebouncedCallback } from "use-debounce";

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

export default function MissingPersonsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [missingPersons, setMissingPersons] =
    useState<MissingPerson[]>(mockMissingPersons);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (!user) return null;

  const debouncedSetSearch = useDebouncedCallback(
    (value: string) => setSearchQuery(value),
    300,
  );

  const handleViewDetail = useCallback(
    (person: MissingPerson) => {
      router.push(`/dashboard/missing-persons/${person.id}`);
    },
    [router],
  );

  const handleCreateNew = useCallback(() => {
    router.push("/dashboard/missing-persons/create");
  }, [router]);

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const handlePublish = useCallback(
    async (id: string) => {
      const person = missingPersons.find((p) => p.id === id);
      if (!person) return;
      try {
        await mockRequest(false);
        setMissingPersons(
          missingPersons.map((p) =>
            p.id === id ? { ...p, status: "Published" as const } : p,
          ),
        );
        toast.success("Report published successfully");
        addNotification({
          type: "missing-person",
          title: "Missing person report published",
          description: `${person.name} is now public and visible to users`,
          reportId: person.id,
        });
      } catch (error) {
        toast.error("Lỗi khi đăng tải báo cáo");
        console.error(error);
      }
    },
    [missingPersons, addNotification],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const person = missingPersons.find((p) => p.id === id);
      if (!person) return;
      try {
        await mockRequest(false);
        setMissingPersons(missingPersons.filter((p) => p.id !== id));
        toast.success("Thành công");
        addNotification({
          type: "missing-person",
          title: "Missing person report deleted",
          description: `${person.name} report has been removed`,
          reportId: person.id,
        });
      } catch (error) {
        toast.error("Lỗi khi xóa báo cáo");
        console.error(error);
      }
    },
    [missingPersons, addNotification],
  );

  const filteredPersons = useMemo(() => {
    return missingPersons.filter((person) => {
      const matchesSearch =
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.lastSeenLocation
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || person.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [missingPersons, searchQuery, statusFilter]);

  return (
    <PageTransition>
      <div>
        <Breadcrumbs items={[{ label: "Missing Person Reports" }]} />
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
                defaultValue={searchQuery}
                onChange={(e) => debouncedSetSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent appearance-none"
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
          onPublish={handlePublish}
          onDelete={handleDelete}
          userRole={user.role}
        />
      </div>
    </PageTransition>
  );
}
