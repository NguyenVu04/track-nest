import { useEffect, useRef, useState } from "react";
import { Plus, Search, Upload, FileText, Trash2, Eye, Paperclip, X } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import { criminalReportsService, GuidelinesDocumentResponse } from "@/services/criminalReportsService";
import { UserRole } from "@/types";

interface GuidelineDashboardProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole[];
  };
}

const ALLOWED_ROLES: UserRole[] = ["Reporter", "Admin"];

export function GuidelineDashboard({ user }: GuidelineDashboardProps) {
  const canManage = ALLOWED_ROLES.some(role => user.role.includes(role));
  const [guidelines, setGuidelines] = useState<GuidelinesDocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuideline, setSelectedGuideline] = useState<GuidelinesDocumentResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    abstractText: "",
    content: "",
  });
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    setIsLoading(true);
    try {
      const response = await criminalReportsService.listGuidelinesDocuments({ isPublic: false });
      setGuidelines(response.content);
    } catch (err) {
      console.error("Failed to fetch guidelines:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedGuideline(null);
    setSubmitError(null);
    setFormData({ title: "", abstractText: "", content: "" });
    setHtmlFile(null);
    setImageFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create the document record, use placeholder content if HTML file will be uploaded
      const contentValue = htmlFile ? `${formData.title}/index.html` : formData.content;
      const doc = await criminalReportsService.createGuidelinesDocument({
        title: formData.title,
        abstractText: formData.abstractText,
        content: contentValue,
        isPublic: false,
      });

      // 2. Upload HTML file → {documentId}/index.html
      if (htmlFile) {
        await criminalReportsService.uploadDocumentFile(doc.id, htmlFile);
      }

      // 3. Upload image files → {documentId}/{filename}
      for (const img of imageFiles) {
        await criminalReportsService.uploadDocumentFile(doc.id, img);
      }

      setIsCreating(false);
      setFormData({ title: "", abstractText: "", content: "" });
      setHtmlFile(null);
      setImageFiles([]);
      await fetchGuidelines();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish guideline.";
      setSubmitError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await criminalReportsService.deleteGuidelinesDocument(id);
      await criminalReportsService.deleteDocumentFolder(id);
    } catch (err) {
      console.error("Failed to delete guideline:", err);
    }
    setConfirmDelete(null);
    if (selectedGuideline?.id === id) setSelectedGuideline(null);
    await fetchGuidelines();
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredGuidelines = guidelines.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.abstractText.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // View mode
  if (selectedGuideline) {
    return (
      <div className="max-w-4xl">
        <button
          onClick={() => setSelectedGuideline(null)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          ← Back to Guidelines
        </button>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-gray-900 mb-2">{selectedGuideline.title}</h2>
              <p className="text-gray-600">{selectedGuideline.abstractText}</p>
            </div>
            <button
              onClick={() => setConfirmDelete(selectedGuideline.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Guideline"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
            <span>
              {new Date(selectedGuideline.createdAt).toLocaleDateString()}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${selectedGuideline.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {selectedGuideline.isPublic ? "Public" : "Draft"}
            </span>
          </div>
          <div className="prose max-w-none">
            <div
              className="text-gray-900"
              dangerouslySetInnerHTML={{ __html: selectedGuideline.content || "" }}
            />
          </div>
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

  // Create mode
  if (isCreating) {
    return (
      <div className="max-w-4xl">
        <button
          onClick={() => setIsCreating(false)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          ← Back to Guidelines
        </button>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-6">Publish New Guideline</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-gray-700 mb-2">Title *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="abstractText" className="block text-gray-700 mb-2">Abstract *</label>
              <input
                id="abstractText"
                type="text"
                value={formData.abstractText}
                onChange={(e) => setFormData({ ...formData, abstractText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* HTML file upload */}
            <div>
              <label className="block text-gray-700 mb-2">
                HTML Article File
                <span className="ml-2 text-xs text-gray-400">(stored as {"{documentId}"}/index.html in MinIO)</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => htmlInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <Paperclip className="w-4 h-4" />
                  {htmlFile ? htmlFile.name : "Choose HTML file"}
                </button>
                {htmlFile && (
                  <button type="button" onClick={() => setHtmlFile(null)} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                ref={htmlInputRef}
                type="file"
                accept=".html,text/html"
                className="hidden"
                onChange={(e) => setHtmlFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Image / asset uploads */}
            <div>
              <label className="block text-gray-700 mb-2">
                Images / Assets
                <span className="ml-2 text-xs text-gray-400">(stored as {"{documentId}"}/{"{filename}"} in MinIO)</span>
              </label>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Paperclip className="w-4 h-4" />
                Add files
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageFilesChange}
              />
              {imageFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {imageFiles.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Paperclip className="w-3 h-3" />
                      {f.name}
                      <button type="button" onClick={() => removeImageFile(i)} className="text-red-400 hover:text-red-600 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Text content fallback (only shown when no HTML file) */}
            {!htmlFile && (
              <div>
                <label htmlFor="content" className="block text-gray-700 mb-2">
                  Content *
                  <span className="ml-2 text-xs text-gray-400">(or upload an HTML file above)</span>
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={12}
                  placeholder="Enter guideline content (Markdown supported)."
                  required={!htmlFile}
                />
              </div>
            )}

            {submitError && (
              <p className="text-red-600 text-sm">{submitError}</p>
            )}

            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isSubmitting ? "Publishing…" : "Publish Guideline"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
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

  // List mode
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-gray-900">System Guidelines</h2>
        {canManage && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Guideline
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search guidelines…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-400">
            Loading…
          </div>
        ) : filteredGuidelines.length === 0 ? (
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
                    <h3 className="text-gray-900">{guideline.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${guideline.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {guideline.isPublic ? "Public" : "Draft"}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{guideline.abstractText}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{new Date(guideline.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setSelectedGuideline(guideline)}
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
