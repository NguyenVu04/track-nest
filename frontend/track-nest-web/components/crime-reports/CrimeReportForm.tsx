"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Save, X, MapPin } from "lucide-react";
import type { CrimeReport, CrimeSeverity } from "@/types";
import { useTranslations } from "next-intl";

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

  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CreateCrimeReportRequest requires title, severity, date, longitude, latitude.
  // UpdateCrimeReportRequest requires title, severity, date but has no lat/lon —
  // the backend does not allow changing a crime report's location after creation.
  const buildReport = (): CrimeReport => ({
    id: report?.id || Date.now().toString(),
    title: formData.title!,
    content: formData.content!,
    contentDocId: report?.contentDocId || "",
    severity: formData.severity!,
    date: formData.date!,
    longitude: formData.longitude!,
    latitude: formData.latitude!,
    numberOfVictims: formData.numberOfVictims!,
    numberOfOffenders: formData.numberOfOffenders!,
    arrested: formData.arrested!,
    photos: report?.photos ?? [],
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
    const newReport = buildReport();
    try {
      setIsSubmitting(true);
      await onSave(newReport);
      setShowReview(false);
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
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? tCommon("submitting") : t("confirmSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
