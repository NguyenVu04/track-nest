"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Save,
  X,
  MapPin,
  Camera,
  Trash2,
  Info,
  Calendar,
  Clock,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  UserPlus,
  Users,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import type { CrimeReport, CrimeSeverity } from "@/types";
import { useTranslations } from "next-intl";
import { criminalReportsService } from "@/services/criminalReportsService";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LocationPicker = dynamic(
  () => import("../shared/LocationPicker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[300px] rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        <span className="text-gray-500 font-medium">
          Loading interactive map...
        </span>
      </div>
    ),
  },
);

const RichTextEditor = dynamic(
  () => import("../shared/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400">Loading editor...</span>
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

  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    report?.photos ?? [],
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Split date into date and time for UI
  const [time, setTime] = useState(() => {
    if (report?.date) {
      return new Date(report.date).toTimeString().slice(0, 5);
    }
    return new Date().toTimeString().slice(0, 5);
  });

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const totalPhotos = existingPhotos.length + selectedFiles.length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - totalPhotos;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length < files.length) {
      toast.warning(
        `Maximum ${MAX_PHOTOS} photos allowed. Only ${toAdd.length} photo(s) were added.`,
      );
    }
    setSelectedFiles((prev) => [...prev, ...toAdd]);
    setPreviewUrls((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
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

  const buildReport = (uploadedPhotoUrls: string[]): CrimeReport => {
    // Combine date and time
    const combinedDate = new Date(formData.date!);
    const [hours, minutes] = time.split(":").map(Number);
    combinedDate.setHours(hours, minutes);

    return {
      id: report?.id || Date.now().toString(),
      title: formData.title!,
      content: formData.content!,
      contentDocId: report?.contentDocId ?? "",
      severity: formData.severity!,
      date: combinedDate.toISOString(),
      longitude: formData.longitude!,
      latitude: formData.latitude!,
      numberOfVictims: formData.numberOfVictims!,
      numberOfOffenders: formData.numberOfOffenders!,
      arrested: formData.arrested!,
      photos: [...existingPhotos, ...uploadedPhotoUrls],
      createdAt: formData.createdAt!,
      updatedAt: new Date().toISOString(),
      reporterId: formData.reporterId!,
      isPublic: formData.isPublic!,
    };
  };

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
          uploadedUrls.push(res.objectName);
        }
        setIsUploading(false);
      }
      const newReport = buildReport(uploadedUrls);
      await onSave(newReport);
      setShowReview(false);
    } catch {
      setIsUploading(false);
      toast.error(
        "Failed to upload photos or submit the report. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const severityOptions = [
    {
      value: 1,
      label: t("severityOpt1"),
      color: "hover:border-green-400 hover:text-green-500",
      active: "border-green-500 bg-green-50 text-green-600 shadow-sm",
    },
    {
      value: 3,
      label: t("severityOpt3"),
      color: "hover:border-orange-400 hover:text-orange-500",
      active: "border-orange-500 bg-orange-50 text-orange-600 shadow-sm",
    },
    {
      value: 5,
      label: t("severityOpt5"),
      color: "hover:border-red-400 hover:text-red-500",
      active: "border-red-500 bg-red-50 text-red-600 shadow-sm",
    },
  ];

  return (
    <div className="w-full mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {mode === "create" ? "Report an Incident" : "Edit Incident Report"}
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Provide detailed information to alert your family circles and local
          authorities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Incident Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Info className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Incident Details
                  </h2>
                  <p className="text-sm text-gray-400 font-medium">
                    BASIC INFORMATION
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Title */}
                <div className="group">
                  <label
                    htmlFor="title"
                    className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1"
                  >
                    Report Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Suspicious activity near the park"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 focus:bg-white text-gray-900 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* Severity Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">
                    Severity Level <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {severityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            severity: opt.value as CrimeSeverity,
                          })
                        }
                        className={cn(
                          "py-4 px-4 rounded-2xl border-2 font-bold transition-all text-center",
                          formData.severity === opt.value
                            ? opt.active
                            : "border-gray-100 bg-gray-50 text-gray-400 " +
                                opt.color,
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1"
                    >
                      Date <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                      <input
                        id="date"
                        type="date"
                        value={formData.date?.slice(0, 10)}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 focus:bg-white text-gray-900 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="time"
                      className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1"
                    >
                      Time <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group">
                      <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                      <input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 focus:bg-white text-gray-900 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1">
                      Victims
                    </label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.numberOfVictims}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numberOfVictims: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-brand-400 focus:bg-white outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1">
                      Offenders
                    </label>
                    <div className="relative group">
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.numberOfOffenders}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numberOfOffenders: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-brand-400 focus:bg-white outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          arrested: !formData.arrested,
                        })
                      }
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold transition-all text-sm",
                        formData.arrested
                          ? "bg-green-50 border-green-200 text-green-600"
                          : "bg-gray-50 border-gray-100 text-gray-400",
                      )}
                    >
                      {formData.arrested ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {formData.arrested ? "Offender Arrested" : "Not Arrested"}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1">
                    Detailed Description
                  </label>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                    <RichTextEditor
                      value={formData.content || ""}
                      onChange={(html) =>
                        setFormData({ ...formData, content: html })
                      }
                      placeholder="Describe what happened, who was involved, and any other relevant details..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Incident Location */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-full flex flex-col transition-all hover:shadow-md">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Incident Location
                  </h2>
                  <p className="text-sm text-gray-400 font-medium">
                    MAP PLACEMENT
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="relative rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shadow-inner group">
                    <LocationPicker
                      position={[
                        formData.latitude || 10.7769,
                        formData.longitude || 106.7009,
                      ]}
                      onPositionChange={(pos) =>
                        setFormData({
                          ...formData,
                          latitude: pos[0],
                          longitude: pos[1],
                        })
                      }
                    />

                    {/* Visual Overlay like in the image */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-white/20">
                        <MapPin className="w-5 h-5 text-brand-500" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-brand-50/50 rounded-2xl border border-brand-100 flex items-start gap-4">
                    <div className="mt-0.5">
                      <div className="p-2 bg-brand-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-brand-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Current Placement
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {formData.latitude?.toFixed(5)},{" "}
                        {formData.longitude?.toFixed(5)}
                      </p>
                      <p className="text-[10px] text-brand-600 font-bold mt-1 uppercase tracking-wider">
                        Coordinates verified
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-amber-700 leading-normal">
                    Note: You cannot change the location after submitting.
                    Please ensure the pin is placed accurately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Bottom: Media Evidence */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-50 rounded-2xl">
                    <Camera className="w-6 h-6 text-teal-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Media Evidence
                    </h2>
                    <p className="text-sm text-gray-400 font-medium uppercase tracking-tight">
                      Photos and Videos
                    </p>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-400">
                  {totalPhotos} / {MAX_PHOTOS} FILES
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={totalPhotos >= MAX_PHOTOS}
                  className="group relative aspect-square flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">
                    Add Media
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </button>

                {/* Previews: Existing */}
                {existingPhotos.map((url, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className="group relative aspect-square rounded-3xl overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <Image
                      src={url}
                      alt="Evidence"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(idx)}
                        className="p-3 bg-red-500 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Previews: New */}
                {previewUrls.map((url, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="group relative aspect-square rounded-3xl overflow-hidden border-2 border-brand-300 shadow-sm"
                  >
                    <Image
                      src={url}
                      alt="New Evidence"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand-500 text-[10px] font-bold text-white rounded-lg shadow-sm">
                      NEW
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSelected(idx)}
                        className="p-3 bg-red-500 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-10 py-4 text-gray-500 font-bold hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === "create" ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Submit Report
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Update Report
              </>
            )}
          </button>
        </div>
      </form>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden border border-white/20">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between p-8 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-brand-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Review Report
                </h3>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="p-2 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Title
                  </p>
                  <p className="text-lg font-bold text-gray-900 leading-tight">
                    {formData.title}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Severity
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 border border-gray-200">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        formData.severity === 1
                          ? "bg-green-500"
                          : formData.severity === 3
                            ? "bg-orange-500"
                            : "bg-red-500",
                      )}
                    />
                    <span className="text-sm font-bold text-gray-700">
                      {
                        severityOptions.find(
                          (o) => o.value === formData.severity,
                        )?.label
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <Calendar className="w-5 h-5 text-brand-500" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Date
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {formData.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <Clock className="w-5 h-5 text-brand-500" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Time
                    </p>
                    <p className="text-sm font-bold text-gray-900">{time}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Description
                </p>
                <div
                  className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-600 prose prose-sm max-w-none prose-brand"
                  dangerouslySetInnerHTML={{
                    __html:
                      formData.content ||
                      "<p className='italic text-gray-400'>No description provided.</p>",
                  }}
                />
              </div>

              {totalPhotos > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Media Evidence ({totalPhotos})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[...existingPhotos, ...previewUrls].map((url, idx) => (
                      <div
                        key={`rev-${idx}`}
                        className="relative w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                onClick={() => setShowReview(false)}
                className="w-full sm:w-auto px-8 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Back to Edit
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-3 bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-600 hover:shadow-lg transition-all disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading Assets...
                  </>
                ) : isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Confirm & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
