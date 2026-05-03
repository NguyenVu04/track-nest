"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Save, X, MapPin, Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import type { CrimeReport, CrimeSeverity } from "@/types";
import { useTranslations } from "next-intl";
import { criminalReportsService } from "@/services/criminalReportsService";
import { toast } from "sonner";

const LocationPicker = dynamic(
  () => import("../shared/LocationPicker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-120 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-500">Loading map...</span>
      </div>
    ),
  },
);

const RichTextEditor = dynamic(
  () => import("../shared/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-500">Loading editor...</span>
      </div>
    ),
  },
);

const MAX_PHOTOS = 5;

interface CrimeReportFormProps {
  report: CrimeReport | null;
  onSave: (report: CrimeReport) => Promise<void> | void;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function CrimeReportForm({
  report,
  onSave,
  onCancel,
  mode,
}: CrimeReportFormProps) {
  const t = useTranslations("crimeReports");
  const tCommon = useTranslations("common");

  const [formData, setFormData] = useState<Partial<CrimeReport>>(
    report || {
      title: "",
      content: "",
      severity: 3,
      date: new Date().toISOString().slice(0, 10),
      longitude: 106.7009,
      latitude: 10.7769,
      numberOfVictims: 0,
      numberOfOffenders: 0,
      arrested: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporterId: "",
      isPublic: false,
    },
  );

  const [existingPhotos, setExistingPhotos] = useState<string[]>(report?.photos ?? []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revoke object URLs when component unmounts to avoid memory leaks.
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPhotos = existingPhotos.length + selectedFiles.length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - totalPhotos;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length < files.length) {
      toast.warning(`Maximum ${MAX_PHOTOS} photos allowed. Only ${toAdd.length} photo(s) were added.`);
    }
    setSelectedFiles((prev) => [...prev, ...toAdd]);
    setPreviewUrls((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const handleRemoveExisting = (idx: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveSelected = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  // CreateCrimeReportRequest requires title, severity, date, longitude, latitude.
  // UpdateCrimeReportRequest requires title, severity, date but has no lat/lon —
  // the backend does not allow changing a crime report's location after creation.
  const buildReport = (uploadedPhotoUrls: string[]): CrimeReport => ({
    id: report?.id || Date.now().toString(),
    title: formData.title!,
    content: formData.content!,
    contentDocId: report?.contentDocId ?? "",
    severity: formData.severity!,
    date: formData.date!,
    longitude: formData.longitude!,
    latitude: formData.latitude!,
    numberOfVictims: formData.numberOfVictims!,
    numberOfOffenders: formData.numberOfOffenders!,
    arrested: formData.arrested!,
    photos: [...existingPhotos, ...uploadedPhotoUrls],
    createdAt: formData.createdAt!,
    updatedAt: formData.updatedAt!,
    reporterId: formData.reporterId!,
    isPublic: formData.isPublic!,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReview(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        for (const file of selectedFiles) {
          const res = await criminalReportsService.uploadFile(file);
          uploadedUrls.push(res.url);
        }
        setIsUploading(false);
      }
      const newReport = buildReport(uploadedUrls);
      await onSave(newReport);
      setShowReview(false);
    } catch {
      setIsUploading(false);
      toast.error("Failed to upload photos or submit the report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900">
          {mode === "create" ? t("formNewTitle") : t("formEditTitle")}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-gray-700 mb-2">
              {t("formTitle")}{tCommon("requiredSuffix")}
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
            <label htmlFor="severity" className="block text-gray-700 mb-2">
              {t("formSeverity")}{tCommon("requiredSuffix")}
            </label>
            <select
              id="severity"
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: Number(e.target.value) as CrimeSeverity })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            >
              <option value={1}>{t("severityOpt1")}</option>
              <option value={2}>{t("severityOpt2")}</option>
              <option value={3}>{t("severityOpt3")}</option>
              <option value={4}>{t("severityOpt4")}</option>
              <option value={5}>{t("severityOpt5")}</option>
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-gray-700 mb-2">
              {t("formDate")}{tCommon("requiredSuffix")}
            </label>
            <input
              id="date"
              type="date"
              value={formData.date?.slice(0, 10)}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="content" className="block text-gray-700 mb-2">
              {t("formContent")}
            </label>
            <RichTextEditor
              value={formData.content || ""}
              onChange={(html) =>
                setFormData({ ...formData, content: html })
              }
              placeholder={t("placeholderContent")}
            />
          </div>

          {/* Location picker — create only; the update API does not accept lat/lon */}
          {mode === "create" && (
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t("formMapLabel")}{tCommon("requiredSuffix")}
                </span>
              </label>
              <LocationPicker
                position={[formData.latitude || 10.7769, formData.longitude || 106.7009]}
                onPositionChange={(position) =>
                  setFormData({
                    ...formData,
                    latitude: position[0],
                    longitude: position[1],
                  })
                }
              />
            </div>
          )}

          <div>
            <label htmlFor="numberOfVictims" className="block text-gray-700 mb-2">
              {t("formVictims")}
            </label>
            <input
              id="numberOfVictims"
              type="number"
              min="0"
              value={formData.numberOfVictims ?? 0}
              onChange={(e) =>
                setFormData({ ...formData, numberOfVictims: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="numberOfOffenders" className="block text-gray-700 mb-2">
              {t("formOffenders")}
            </label>
            <input
              id="numberOfOffenders"
              type="number"
              min="0"
              value={formData.numberOfOffenders ?? 0}
              onChange={(e) =>
                setFormData({ ...formData, numberOfOffenders: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.arrested ?? false}
                onChange={(e) =>
                  setFormData({ ...formData, arrested: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">{t("formArrested")}</span>
            </label>
          </div>

          {/* ── Photo Upload ── */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-700">
                {t("formPhotos")}
                <span className="ml-1 text-gray-400 text-sm font-normal">
                  ({totalPhotos}/{MAX_PHOTOS})
                </span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={totalPhotos >= MAX_PHOTOS}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4" />
                {t("addPhoto")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {totalPhotos > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {/* Existing photos (edit mode) */}
                {existingPhotos.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                    <Image
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* New photos (local preview) */}
                {previewUrls.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-indigo-300 group">
                    <Image
                      src={url}
                      alt={`New photo ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/70 py-0.5 text-center">
                      <span className="text-white text-xs font-medium">New</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelected(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-indigo-400 hover:text-indigo-400 cursor-pointer transition-colors"
              >
                <Camera className="w-8 h-8" />
                <span className="text-sm">{t("addPhoto")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? tCommon("saving")
              : mode === "create"
                ? t("createButton")
                : tCommon("save")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
            {tCommon("cancel")}
          </button>
        </div>
      </form>

      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-gray-900">{t("reviewTitle")}</h3>
              <button
                onClick={() => setShowReview(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-600 text-sm">{t("formTitle")}</p>
                <p className="text-gray-900">{formData.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">{t("reviewSeverity")}</p>
                  <p className="text-gray-900">{formData.severity}/5</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">{t("reviewVictims")}</p>
                  <p className="text-gray-900">{formData.numberOfVictims ?? 0}</p>
                </div>
              </div>
              {mode === "create" && (
                <div>
                  <p className="text-gray-600 text-sm">{t("reviewLocation")}</p>
                  <p className="text-gray-900">
                    {formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-600 text-sm">{t("reviewDate")}</p>
                <p className="text-gray-900">
                  {formData.date ? new Date(formData.date).toLocaleString() : ""}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{tCommon("description")}</p>
                <div
                  className="text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.content || "" }}
                />
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t("reviewOffenders")}</p>
                <p className="text-gray-900">{formData.numberOfOffenders ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t("reviewArrested")}</p>
                <p className="text-gray-900">
                  {formData.arrested ? tCommon("yes") : tCommon("no")}
                </p>
              </div>
              {totalPhotos > 0 && (
                <div>
                  <p className="text-gray-600 text-sm mb-2">{t("formPhotos")} ({totalPhotos})</p>
                  <div className="flex flex-wrap gap-2">
                    {existingPhotos.map((url, idx) => (
                      <div key={`rev-existing-${idx}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <Image src={url} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ))}
                    {previewUrls.map((url, idx) => (
                      <div key={`rev-new-${idx}`} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-indigo-300">
                        <Image src={url} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                  {selectedFiles.length > 0 && (
                    <p className="text-xs text-indigo-600 mt-1">
                      {selectedFiles.length} new photo(s) will be uploaded on submit.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowReview(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                {t("backToEdit")}
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading photos…
                  </>
                ) : isSubmitting ? (
                  tCommon("submitting")
                ) : (
                  t("confirmSubmit")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
