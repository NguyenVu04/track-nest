"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Save, X, MapPin } from "lucide-react";
import type { CrimeReport } from "@/types";

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
  () => import("../shared/LocationPicker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-500">Loading map...</span>
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
  const [formData, setFormData] = useState<Partial<CrimeReport>>(
    report || {
      title: "",
      content: "",
      severity: 3,
      date: new Date().toISOString().slice(0, 16),
      longitude: -73.9654,
      latitude: 40.7829,
      numberOfVictims: 0,
      numberOfOffenders: 0,
      arrested: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporterId: "",
      isPublic: true,
    },
  );
  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buildReport = (): CrimeReport => ({
    id: report?.id || Date.now().toString(),
    title: formData.title!,
    content: formData.content!,
    severity: formData.severity!,
    date: formData.date!,
    longitude: formData.longitude!,
    latitude: formData.latitude!,
    numberOfVictims: formData.numberOfVictims!,
    numberOfOffenders: formData.numberOfOffenders!,
    arrested: formData.arrested!,
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
          {mode === "create" ? "New Crime Report" : "Edit Crime Report"}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
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
            <label htmlFor="severity" className="block text-gray-700 mb-2">
              Severity *
            </label>
            <select
              id="severity"
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: Number(e.target.value) as any })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            >
              <option value={1}>Low (1)</option>
              <option value={2}>Low-Medium (2)</option>
              <option value={3}>Medium (3)</option>
              <option value={4}>High (4)</option>
              <option value={5}>Critical (5)</option>
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-gray-700 mb-2">
              Incident Date *
            </label>
            <input
              id="date"
              type="datetime-local"
              value={formData.date?.slice(0, 16)}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="content" className="block text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              rows={4}
              placeholder="Describe the incident in detail..."
              required
            />
          </div>

          {/* Location Picker Map */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Incident Location on Map *
              </span>
            </label>
            <LocationPicker
              position={
                [formData.latitude || 40.7829, formData.longitude || -73.9654]
              }
              onPositionChange={(position) =>
                setFormData({ 
                  ...formData, 
                  latitude: position[0],
                  longitude: position[1]
                })
              }
            />
          </div>

          <div>
            <label htmlFor="latitude" className="block text-gray-700 mb-2">
              Latitude *
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              value={formData.latitude ?? 40.7829}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  latitude: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-gray-700 mb-2">
              Longitude *
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              value={formData.longitude ?? -73.9654}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  longitude: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="numberOfVictims" className="block text-gray-700 mb-2">
              Number of Victims
            </label>
            <input
              id="numberOfVictims"
              type="number"
              min="0"
              value={formData.numberOfVictims ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numberOfVictims: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="numberOfOffenders" className="block text-gray-700 mb-2">
              Number of Offenders
            </label>
            <input
              id="numberOfOffenders"
              type="number"
              min="0"
              value={formData.numberOfOffenders ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numberOfOffenders: parseInt(e.target.value),
                })
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
                  setFormData({
                    ...formData,
                    arrested: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-gray-700">Arrests made</span>
            </label>
          </div>
        </div>
      </form>

      {showReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-gray-900">Review Crime Report</h3>
              <button
                onClick={() => setShowReview(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Title</p>
                <p className="text-gray-900">{formData.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Severity</p>
                  <p className="text-gray-900">{formData.severity}/5</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Number of Victims</p>
                  <p className="text-gray-900">{formData.numberOfVictims ?? 0}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Location</p>
                <p className="text-gray-900">
                  {formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Incident Date</p>
                <p className="text-gray-900">
                  {formData.date
                    ? new Date(formData.date).toLocaleString()
                    : ""}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Description</p>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {formData.content}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Number of Offenders</p>
                <p className="text-gray-900">{formData.numberOfOffenders ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Arrests Made</p>
                <p className="text-gray-900">{formData.arrested ? "Yes" : "No"}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowReview(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Back to Edit
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
