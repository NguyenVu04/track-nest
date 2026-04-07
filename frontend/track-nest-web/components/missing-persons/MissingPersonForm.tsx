"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Save, X, MapPin, User, Calendar, FileText, Phone, Mail } from "lucide-react";
import type { MissingPerson } from "@/types";
import { criminalReportsService, CreateMissingPersonReportRequest } from "@/services/criminalReportsService";
import { useTranslations } from "next-intl";

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
    person ? [10.8231, 106.6297] : [10.8231, 106.6297]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const request: CreateMissingPersonReportRequest = {
          title: formData.title || formData.fullName || "Missing Person Report",
          fullName: formData.fullName!,
          personalId: formData.personalId!,
          photo: formData.photo,
          date: formData.date!,
          content: formData.content!,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
        };

        const response = await criminalReportsService.createMissingPersonReport(request);
        const newPerson: MissingPerson = {
          id: response.id,
          title: response.title,
          fullName: response.fullName,
          personalId: response.personalId,
          photo: response.photo,
          date: response.date,
          content: response.content,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          createdAt: response.createdAt,
          userId: response.userId,
          status: response.status as MissingPerson["status"],
          reporterId: response.reporterId,
          isPublic: response.isPublic,
        };
        onSave(newPerson);
      } else {
        onSave(formData as MissingPerson);
      }
    } catch (error) {
      console.error("Error saving missing person report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <label htmlFor="photo" className="block text-gray-700 mb-2">
              {t("formPhotoUrl")}
            </label>
            <input
              id="photo"
              type="url"
              value={formData.photo}
              onChange={(e) =>
                setFormData({ ...formData, photo: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              placeholder={t("placeholderPhoto")}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t("formLocationCoords")}{tCommon("requiredSuffix")}
              </span>
            </label>
            <LocationPicker
              position={coordinates}
              onPositionChange={(position) => setCoordinates(position)}
            />
          </div>

          <div>
            <label htmlFor="latitude" className="block text-gray-700 mb-2">
              {tCommon("latitude")}{tCommon("requiredSuffix")}
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              value={coordinates[0]}
              onChange={(e) =>
                setCoordinates([parseFloat(e.target.value), coordinates[1]])
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-gray-700 mb-2">
              {tCommon("longitude")}{tCommon("requiredSuffix")}
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              value={coordinates[1]}
              onChange={(e) =>
                setCoordinates([coordinates[0], parseFloat(e.target.value)])
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="content" className="block text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t("formContent")}{tCommon("requiredSuffix")}
              </span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              rows={4}
              placeholder={t("placeholderContent")}
              required
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
