"use client";

import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Trash2,
  MapPin,
  Calendar,
  User,
  ExternalLink
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

  const isPending = person.status === "PENDING";
  const isPublished = person.status === "PUBLISHED";

  return (
    <>
      <div className="max-w-7xl mx-auto pb-10">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-sm border border-gray-200 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t("detailTitle")}
            </h2>
          </div>

          {(userRole.includes("Reporter") || userRole.includes("User")) && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onEdit(person)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">{tCommon("edit")}</span>
              </button>
              {isPending && (
                <button
                  onClick={() => setConfirmAction("publish")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{tCommon("publish")}</span>
                </button>
              )}
              <button
                onClick={() => setConfirmAction("delete")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{tCommon("delete")}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              {/* Photo Section */}
              <div className="relative h-[340px] w-full bg-gray-50">
                {person.photo ? (
                  <img
                    src={person.photo}
                    alt={person.fullName}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                    <User className="w-24 h-24 opacity-30 mb-2" />
                    <span className="text-sm font-medium">No Photo Available</span>
                  </div>
                )}

                {/* Overlaid Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${
                      isPending
                        ? "bg-[#d32f2f] text-white"
                        : isPublished
                        ? "bg-blue-600 text-white"
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    {isPending && <span className="text-[12px] leading-none">✱</span>}
                    {isPending ? "SEARCHING" : person.status}
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="p-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-3">
                  {person.fullName}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-8">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>
                    Missing since{" "}
                    {new Date(person.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 gap-y-7 gap-x-4">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      {t("detailPersonalId", { defaultMessage: "Personal ID" })}
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {person.personalId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      Reported At
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(person.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      Contact Email
                    </p>
                    <p className="text-base font-semibold text-gray-900 break-words">
                      {person.contactEmail || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      Contact Phone
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {person.contactPhone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Map & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Map Card */}
            {person.latitude != null && person.longitude != null && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Last Confirmed Location
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mt-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>
                        Lat: {person.latitude.toFixed(4)}, Lng:{" "}
                        {person.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${person.latitude},${person.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
                  >
                    Open in Maps
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="w-full h-[360px] rounded-2xl overflow-hidden border border-gray-100 relative shadow-inner">
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
              </div>
            )}

            {/* Content Details Card */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {t("detailDescription", { defaultMessage: "Report Details" })}
              </h3>

              <div className="text-gray-700 prose prose-sm sm:prose-base max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-img:rounded-2xl">
                {person.content?.startsWith("http") ? (
                  <iframe
                    title="Missing person report content"
                    src={person.content}
                    className="w-full min-h-[500px] rounded-2xl border border-gray-200 bg-gray-50"
                  />
                ) : person.content?.trim().startsWith("<") ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: person.content || "" }}
                  />
                ) : (
                  <p className="whitespace-pre-line leading-relaxed text-[15px]">
                    {person.content || "No detailed description provided for this report."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chatbot Section */}
        <div className="mt-8">
          <ChatbotPanel
            documentId={person.contentDocId}
            title="Missing Person Report Chat"
            emptyState="Ask a question about this report."
          />
        </div>
      </div>

      {/* Modals */}
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

