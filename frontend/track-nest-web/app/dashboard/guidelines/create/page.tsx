"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  criminalReportsService,
  CreateGuidelinesDocumentRequest,
} from "@/services/criminalReportsService";

const RichTextEditor = dynamic(
  () =>
    import("@/components/shared/RichTextEditor").then(
      (mod) => mod.RichTextEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-500">Loading editor...</span>
      </div>
    ),
  },
);

export default function CreateGuidelinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    abstractText: "",
    content: "",
  });

  if (!user) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Unauthorized</h2>
        <p className="text-gray-600 mb-4">
          You do not have permission to create guidelines.
        </p>
        <button onClick={() => router.back()} className="text-indigo-600 hover:text-indigo-700">
          ← Go Back
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPreviewing(true);
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      const request: CreateGuidelinesDocumentRequest = {
        title: formData.title,
        abstractText: formData.abstractText,
        content: formData.content,
        isPublic: false,
      };
      const created = await criminalReportsService.createGuidelinesDocument(request);
      await criminalReportsService.publishGuidelinesDocument(created.id);
      toast.success("Guideline published successfully");
      router.push("/dashboard/guidelines");
    } catch (error) {
      toast.error("Failed to publish guideline");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const request: CreateGuidelinesDocumentRequest = {
        title: formData.title,
        abstractText: formData.abstractText,
        content: formData.content,
        isPublic: false,
      };
      await criminalReportsService.createGuidelinesDocument(request);
      toast.success("Guideline saved as draft");
      router.push("/dashboard/guidelines");
    } catch (error) {
      toast.error("Failed to save guideline");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPreviewing) {
    return (
      <div className="max-w-4xl">
        <button
          onClick={() => setIsPreviewing(false)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          ← Back to Edit
        </button>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-gray-900 mb-2 text-xl font-semibold">
                {formData.title || "(Untitled)"}
              </h2>
              <p className="text-gray-600">{formData.abstractText}</p>
            </div>
          </div>
          <div className="prose max-w-none mb-6">
            {formData.content ? (
              <div
                className="text-gray-900"
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            ) : (
              <div className="text-gray-500">(No content)</div>
            )}
          </div>
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isSubmitting ? "Publishing…" : "Publish Guideline"}
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => setIsPreviewing(false)}
              className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
      >
        ← Back to Guidelines
      </button>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-gray-900 mb-6 text-xl font-semibold">New Guideline</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-gray-700 mb-2">Title *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="abstractText" className="block text-gray-700 mb-2">Abstract / Description *</label>
            <input
              id="abstractText"
              type="text"
              value={formData.abstractText}
              onChange={(e) => setFormData({ ...formData, abstractText: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-gray-700 mb-2">Content *</label>
            <RichTextEditor
              value={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
              placeholder="Enter the guideline content."
              height={420}
            />
          </div>
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
