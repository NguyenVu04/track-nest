"use client";

import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import type { CrimeReport } from "@/types";
import { MapView } from "../shared/MapView";
import { ConfirmModal } from "../shared/ConfirmModal";
import { useTranslations } from "next-intl";

interface CrimeReportDetailProps {
  report: CrimeReport;
  onBack: () => void;
  onEdit: (report: CrimeReport) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

export function CrimeReportDetail({
  report,
  onBack,
  onEdit,
  onDelete,
  userRole,
}: CrimeReportDetailProps) {
  const t = useTranslations("crimeReports");
  const tCommon = useTranslations("common");

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(report.id);
    setConfirmDelete(false);
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 5: return "bg-red-100 text-red-800";
      case 4: return "bg-orange-100 text-orange-800";
      case 3: return "bg-yellow-100 text-yellow-800";
      case 2: return "bg-blue-100 text-blue-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 5: return t("severityVeryHigh");
      case 4: return t("severityHigh");
      case 3: return t("severityMedium");
      case 2: return t("severityLow");
      default: return t("severityVeryLow");
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
              {userRole === "Reporter" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(report)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title={tCommon("edit")}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
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
                <p className="text-gray-900">{report.content}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-2">{t("detailAdditional")}</p>
                <p className="text-gray-600 text-sm">{t("detailVictims")}: {report.numberOfVictims}</p>
                <p className="text-gray-600 text-sm">{t("detailOffenders")}: {report.numberOfOffenders}</p>
                <p className="text-gray-600 text-sm">{t("detailArrested")}: {report.arrested ? tCommon("yes") : tCommon("no")}</p>
              </div>
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

      {confirmDelete && (
        <ConfirmModal
          title={t("deleteTitle")}
          message={t("deleteMessage", { title: report.title })}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(false)}
          confirmText={tCommon("delete")}
          confirmStyle="danger"
        />
      )}
    </>
  );
}
