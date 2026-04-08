"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Guideline } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";

export default function GuidelineDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [guideline, setGuideline] = useState<Guideline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    const fetchGuideline = async () => {
      try {
        setIsLoading(true);
        const response = await criminalReportsService.getGuidelinesDocument(id);
        setGuideline({
          id: response.id,
          title: response.title,
          abstractText: response.abstractText,
          content: response.content,
          createdAt: response.createdAt,
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      } catch (error) {
        console.error("Failed to fetch guideline:", error);
        toast.error("Failed to load guideline");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuideline();
  }, [user, id]);

  if (!user) return null;
  if (isLoading) return <Loading />;

  if (!guideline) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Guideline Not Found</h2>
        <button onClick={() => router.back()} className="text-indigo-600 hover:text-indigo-700">
          ← Go Back
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await criminalReportsService.deleteGuidelinesDocument(id);
      toast.success("Guideline deleted");
      router.push("/dashboard/guidelines");
    } catch (error) {
      toast.error("Failed to delete guideline");
      console.error(error);
    }
  };

  const handlePublish = async () => {
    try {
      const response = await criminalReportsService.publishGuidelinesDocument(id);
      setGuideline((prev) => prev ? { ...prev, isPublic: response.isPublic } : prev);
      toast.success("Guideline published");
    } catch (error) {
      toast.error("Failed to publish guideline");
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
        ← Back to Guidelines
      </button>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900 mb-2 text-xl font-semibold">{guideline.title}</h2>
            <p className="text-gray-600">{guideline.abstractText}</p>
          </div>
          <div className="flex items-center gap-2">
            {!guideline.isPublic && (
              <button
                onClick={handlePublish}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Publish Guideline"
              >
                <Globe className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Guideline"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
          <span>Created {new Date(guideline.createdAt).toLocaleDateString()}</span>
          {guideline.isPublic && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Published</span>
          )}
        </div>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-900">{guideline.content}</div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Guideline"
          message="Are you sure you want to delete this guideline? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
