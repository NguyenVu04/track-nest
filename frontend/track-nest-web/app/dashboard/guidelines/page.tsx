"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Guideline } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";

export default function GuidelinesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchGuidelines = async () => {
      try {
        setIsLoading(true);
        const response = await criminalReportsService.listGuidelinesDocuments({
          isPublic: false,
          page: 0,
          size: 100,
        });
        setGuidelines(
          response.content.map((item) => ({
            id: item.id,
            title: item.title,
            abstractText: item.abstractText,
            content: item.content,
            contentDocId: item.contentDocId,
            createdAt: item.createdAt,
            reporterId: item.reporterId,
            isPublic: item.isPublic,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch guidelines:", error);
        toast.error("Failed to load guidelines");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuidelines();
  }, [user]);

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  const handleDelete = async (id: string) => {
    try {
      await criminalReportsService.deleteGuidelinesDocument(id);
      setGuidelines((prev) => prev.filter((g) => g.id !== id));
      setConfirmDelete(null);
      toast.success("Guideline deleted");
    } catch (error) {
      toast.error("Failed to delete guideline");
      console.error(error);
    }
  };

  const filteredGuidelines = guidelines.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.abstractText.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-gray-900 text-xl font-semibold">System Guidelines</h2>
        <button
          onClick={() => router.push("/dashboard/guidelines/create")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Guideline
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredGuidelines.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No guidelines found.</p>
          </div>
        ) : (
          filteredGuidelines.map((guideline) => (
            <div
              key={guideline.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-gray-900 font-medium">{guideline.title}</h3>
                    {guideline.isPublic && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Published
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{guideline.abstractText}</p>
                  <span className="text-sm text-gray-500">
                    {new Date(guideline.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => router.push(`/dashboard/guidelines/${guideline.id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Guideline"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(guideline.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Guideline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Guideline"
          message="Are you sure you want to delete this guideline? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
