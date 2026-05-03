"use client";

import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Trash2,
  MapPin,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import type { CrimeReport, UserRole } from "@/types";
import { MapView } from "../shared/MapView";
import { ConfirmModal } from "../shared/ConfirmModal";
import { ChatbotPanel } from "../shared/ChatbotPanel";
import { useTranslations } from "next-intl";

interface CrimeReportDetailProps {
  report: CrimeReport;
  onBack: () => void;
  onEdit: (report: CrimeReport) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: UserRole[];
}

export function CrimeReportDetail({
  report,
  onBack,
  onEdit,
  onPublish,
  onDelete,
  userRole,
}: CrimeReportDetailProps) {
  const t = useTranslations("crimeReports");
  const tCommon = useTranslations("common");

  const [confirmAction, setConfirmAction] = useState<"publish" | "delete" | null>(null);

  const handleConfirmPublish = () => {
    onPublish(report.id);
    setConfirmAction(null);
  };

  const handleConfirmDelete = () => {
    onDelete(report.id);
    setConfirmAction(null);
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5:
        return "bg-red-100 text-red-800";
      case 4:
        return "bg-orange-100 text-orange-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 5:
        return t("severityVeryHigh");
      case 4:
        return t("severityHigh");
      case 3:
        return t("severityMedium");
      case 2:
        return t("severityLow");
      default:
        return t("severityVeryLow");
    }
  };

  const zones = [
    {
      type: "circle" as const,
      center: [report.latitude, report.longitude] as [number, number],
      radius: 500,
      color: "#ef4444",
    },
  ];

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
          {/* Report Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-2">{report.title}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(report.severity)}`}
                  >
                    {getSeverityLabel(report.severity)} ({report.severity}/5)
                  </span>
                </div>
              </div>
              {(userRole.includes("Reporter") || userRole.includes("User")) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(report)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title={tCommon("edit")}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!report.isPublic && (
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
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">{t("detailCoordinates")}</p>
                  <p className="text-gray-900 mt-1">
                    {report.latitude}, {report.longitude}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">{t("detailIncidentDate")}</p>
                  <p className="text-gray-900 mt-1">
                    {new Date(report.date).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-2">{tCommon("description")}</p>
                <div className="text-gray-900 prose prose-sm max-w-none">
                  {report.content?.startsWith("http") ? (
                    <iframe
                      title="Crime report content"
                      src={report.content}
                      className="w-full min-h-[280px] rounded-lg border border-gray-200 bg-white"
                    />
                  ) : report.content?.trim().startsWith("<") ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: report.content || "" }}
                    />
                  ) : (
                    <p className="whitespace-pre-line">
                      {report.content || ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-2">{t("detailAdditional")}</p>
                <p className="text-gray-600 text-sm">
                  {t("detailVictims")}: {report.numberOfVictims}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("detailOffenders")}: {report.numberOfOffenders}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("detailArrested")}:{" "}
                  {report.arrested ? tCommon("yes") : tCommon("no")}
                </p>
              </div>

              {report.photos && report.photos.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-700 mb-3">{t("formPhotos")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {report.photos.map((url) => (
                      <div
                        key={url}
                        className="relative aspect-video rounded-lg overflow-hidden border border-gray-200"
                      >
                        <Image
                          src={url}
                          alt="Crime scene photo"
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
          </div>

          {/* Map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <h3 className="text-gray-900 mb-4">{t("detailMapTitle")}</h3>
            <MapView
              center={[report.latitude, report.longitude]}
              markers={[
                {
                  position: [report.latitude, report.longitude],
                  label: report.title,
                },
              ]}
              zones={zones}
            />
          </div>
        </div>
      </div>

      <ChatbotPanel
        documentId={report.contentDocId}
        title="Crime Report Chat"
        emptyState="Ask a question about this report."
      />

      {confirmAction === "publish" && (
        <ConfirmModal
          title={t("publishTitle")}
          message={t("publishMessage", { title: report.title })}
          onConfirm={handleConfirmPublish}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("publish")}
          confirmStyle="primary"
        />
      )}

      {confirmAction === "delete" && (
        <ConfirmModal
          title={t("deleteTitle")}
          message={t("deleteMessage", { title: report.title })}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("delete")}
          confirmStyle="danger"
        />
      )}
    </>
  );
}
