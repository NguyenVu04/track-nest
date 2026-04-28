"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Save, X, MapPin, User, Calendar, FileText, Phone, Mail, Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import type { MissingPerson } from "@/types";
import {
  criminalReportsService,
  UpdateMissingPersonReportRequest,
} from "@/services/criminalReportsService";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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

interface MissingPersonFormProps {
  person: MissingPerson | null;
  onSave: (person: MissingPerson) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function MissingPersonForm({
  person,
  onSave,
  onCancel,
  mode,
}: MissingPersonFormProps) {
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<MissingPerson>>(
    person || {
      fullName: "",
      personalId: "",
      photo: "",
      date: new Date().toISOString().slice(0, 10),
      content: "",
      contactEmail: "",
      contactPhone: "",
      title: "",
      status: "PENDING",
    }
  );

  const [coordinates, setCoordinates] = useState<[number, number]>(
    person?.latitude != null && person?.longitude != null
      ? [person.latitude, person.longitude]
      : [10.8231, 106.6297]
  );

  // In create mode the photo File is held locally and submitted together with
  // the form via submitMissingPersonReport (multipart). The backend's
  // /missing-person-request-receiver/submit endpoint handles the MinIO upload
  // atomically — ROLE_USER or ROLE_ADMIN is required for that path.
  // In edit mode the photo field holds the existing stored key/URL.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>(
    mode === "edit" ? (person?.photo ?? "") : ""
  );

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mode === "create") {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    } else {
      handleEditPhotoUpload(file);
    }
  };

  const handleEditPhotoUpload = async (file: File) => {
    try {
      const result = await criminalReportsService.uploadFile(file, "criminal-reports");
      setFormData((prev) => ({ ...prev, photo: result.url }));
      setPhotoPreviewUrl(result.url);
    } catch {
      toast.error(t("uploadPhotoError"));
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handlePhotoFileChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    setFormData((prev) => ({ ...prev, photo: "" }));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        // Uses the multipart submit endpoint (ROLE_USER or ROLE_ADMIN).
        // Photo upload is handled atomically server-side.
        const response = await criminalReportsService.submitMissingPersonReport({
          title: formData.title || formData.fullName || "Missing Person Report",
          fullName: formData.fullName!,
          personalId: formData.personalId!,
          photo: photoFile ?? undefined,
          date: formData.date!,
          content: formData.content!,
          contactEmail: formData.contactEmail || "",
          contactPhone: formData.contactPhone!,
        });
        onSave({
          id: response.id,
          title: response.title,
          fullName: response.fullName,
          personalId: response.personalId,
          photo: response.photo,
          date: response.date,
          content: response.content,
          latitude: response.latitude,
          longitude: response.longitude,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          createdAt: response.createdAt,
          userId: response.userId,
          status: response.status as MissingPerson["status"],
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      } else {
        const updateRequest: UpdateMissingPersonReportRequest = {
          title: formData.title,
          fullName: formData.fullName,
          personalId: formData.personalId,
          photo: formData.photo || undefined,
          date: formData.date,
          content: formData.content,
          latitude: coordinates[0],
          longitude: coordinates[1],
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone ?? "",
        };
        const response = await criminalReportsService.updateMissingPersonReport(
          person!.id,
          updateRequest,
        );
        onSave({
          id: response.id,
          title: response.title,
          fullName: response.fullName,
          personalId: response.personalId,
          photo: response.photo,
          date: response.date,
          content: response.content,
          latitude: response.latitude,
          longitude: response.longitude,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          createdAt: response.createdAt,
          userId: response.userId,
          status: response.status as MissingPerson["status"],
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        });
      }
    } catch (error) {
      console.error("Error saving missing person report:", error);
      toast.error(mode === "create" ? t("toastCreateError") : t("toastUpdateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPhotoSrc = photoPreviewUrl || formData.photo || "";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-2xl font-semibold">
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
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t("formReportTitle")}{tCommon("requiredSuffix")}
              </span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              placeholder={t("placeholderTitle")}
              required
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t("formFullName")}{tCommon("requiredSuffix")}
              </span>
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              placeholder={t("placeholderFullName")}
              required
            />
          </div>

          <div>
            <label htmlFor="personalId" className="block text-gray-700 mb-2">
              {t("formPersonalId")}{tCommon("requiredSuffix")}
            </label>
            <input
              id="personalId"
              type="text"
              value={formData.personalId}
              onChange={(e) =>
                setFormData({ ...formData, personalId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              placeholder={t("placeholderId")}
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("formDateMissing")}{tCommon("requiredSuffix")}
              </span>
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">{t("formPhotoUrl")}</label>

            {currentPhotoSrc ? (
              <div className="relative w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                <Image
                  src={currentPhotoSrc}
                  alt="Uploaded photo"
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  {t("removePhoto")}
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={() => photoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handlePhotoDrop}
              >
                <div className="flex flex-col items-center gap-2 text-gray-500 pointer-events-none">
                  <Upload className="w-7 h-7 text-gray-400" />
                  <span className="text-sm font-medium">{t("uploadPhotoBtn")}</span>
                  <span className="text-xs text-gray-400">{t("uploadPhotoHint")}</span>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t("formLocationCoords")}
              </span>
            </label>
            <LocationPicker
              position={coordinates}
              onPositionChange={(position) => setCoordinates(position)}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="content" className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t("formContent")}{tCommon("requiredSuffix")}
              </span>
            </label>
            <RichTextEditor
              value={formData.content || ""}
              onChange={(html) =>
                setFormData({ ...formData, content: html })
              }
              placeholder={t("placeholderContent")}
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t("formContactEmail")}
              </span>
            </label>
            <input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              placeholder={t("placeholderEmail")}
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t("formContactPhone")}{tCommon("requiredSuffix")}
              </span>
            </label>
            <input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData({ ...formData, contactPhone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              placeholder={t("placeholderPhone")}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? tCommon("saving") : mode === "create" ? t("createButton") : tCommon("save")}
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
    </div>
  );
}
