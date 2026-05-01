"use client";

import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Trash2,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { useState } from "react";
import type { MissingPerson, UserRole } from "@/types";
import { MapView } from "../shared/MapView";
import { ConfirmModal } from "../shared/ConfirmModal";
import { ChatbotPanel } from "../shared/ChatbotPanel";
import { useTranslations } from "next-intl";

interface MissingPersonDetailProps {
  person: MissingPerson;
  onBack: () => void;
  onEdit: (person: MissingPerson) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: UserRole[];
}

export function MissingPersonDetail({
  person,
  onBack,
  onEdit,
  onPublish,
  onDelete,
  userRole,
}: MissingPersonDetailProps) {
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");

  const [confirmAction, setConfirmAction] = useState<
    "publish" | "delete" | null
  >(null);

  const handleConfirmPublish = () => {
    onPublish(person.id);
    setConfirmAction(null);
  };

  const handleConfirmDelete = () => {
    onDelete(person.id);
    setConfirmAction(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PUBLISHED":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center gap-4 mb-6 text-black">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-gray-900">{t("detailTitle")}</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Person Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-2">{person.fullName}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    person.status,
                  )}`}
                >
                  {person.status}
                </span>
              </div>
              {(userRole.includes("Reporter") || userRole.includes("User")) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(person)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title={tCommon("edit")}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {person.status === "PENDING" && (
                    <button
                      onClick={() => setConfirmAction("publish")}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title={tCommon("publish")}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmAction("delete")}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={tCommon("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">{t("detailName")}</p>
                  <p className="text-gray-900 mt-1">{person.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">{t("detailPersonalId")}</p>
                  <p className="text-gray-900 mt-1">{person.personalId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">{t("detailDate")}</p>
                  <p className="text-gray-900 mt-1">
                    {new Date(person.date).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-2">{t("detailDescription")}</p>
                <div
                  className="text-gray-900 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: person.content || "" }}
                />
              </div>

              {person.photo && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-700 mb-2">{t("detailPhoto")}</p>
                  <img
                    src={person.photo}
                    alt={person.fullName}
                    className="w-full max-w-xs rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          {person.latitude != null && person.longitude != null && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
              <h3 className="text-gray-900 mb-4">{t("mapTitle")}</h3>
              <MapView
                center={[person.latitude, person.longitude]}
                markers={[
                  {
                    position: [person.latitude, person.longitude] as [
                      number,
                      number,
                    ],
                    label: person.fullName,
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <ChatbotPanel
        documentId={person.id}
        title="Missing Person Report Chat"
        emptyState="Ask a question about this report."
      />

      {confirmAction === "publish" && (
        <ConfirmModal
          title={t("detailPublishTitle")}
          message={t("detailPublishMessage")}
          onConfirm={handleConfirmPublish}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("publish")}
          confirmStyle="primary"
        />
      )}

      {confirmAction === "delete" && (
        <ConfirmModal
          title={t("detailDeleteTitle")}
          message={t("detailDeleteMessage")}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("delete")}
          confirmStyle="danger"
        />
      )}
    </>
  );
}
