"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function CreateGuidelinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Missing Persons",
    content: "",
  });

  if (!user || user.role !== "Reporter") {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Unauthorized</h2>
        <p className="text-gray-600 mb-4">
          You do not have permission to create guidelines.
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

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPreviewing(true);
  };

  const handlePublish = async () => {
    try {
      await mockRequest(false);
      // In a real app, you would send this to the server
      toast.success("Đăng tải thành công");
      router.push("/dashboard/guidelines");
    } catch (error) {
      toast.error("Lỗi khi đăng tải tài liệu hướng dẫn");
      console.error(error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Preview mode
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
              <p className="text-gray-600">{formData.description}</p>
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
              {formData.category}
            </span>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-900">
              {formData.content || "(No content)"}
            </div>
          </div>
          <div className="flex items-center gap-4 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Publish Guideline
            </button>
            <button
              onClick={() => setIsPreviewing(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create form
  return (
    <div className="max-w-4xl">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
      >
        ← Back to Guidelines
      </button>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-gray-900 mb-6 text-xl font-semibold">
          Publish New Guideline
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-gray-700 mb-2">
              Description *
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            >
              <option value="Missing Persons">Missing Persons</option>
              <option value="Crime Reports">Crime Reports</option>
              <option value="System Administration">
                System Administration
              </option>
              <option value="Emergency Procedures">Emergency Procedures</option>
              <option value="General">General</option>
            </select>
          </div>
          <div>
            <label htmlFor="content" className="block text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              rows={12}
              placeholder="Enter the guideline content. You can use Markdown formatting."
              required
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
              onClick={handleBack}
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
