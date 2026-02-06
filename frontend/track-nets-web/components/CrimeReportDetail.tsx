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
import { MapView } from "./MapView";
import { ConfirmModal } from "./ConfirmModal";

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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(report.id);
    setConfirmDelete(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Low":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "High":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-red-100 text-red-800";
      case "Under Investigation":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const zones =
    report.zoneType === "circle"
      ? [
          {
            type: "circle" as const,
            center: report.coordinates,
            radius: report.zoneRadius,
            color: "#ef4444",
          },
        ]
      : [
          {
            type: "rectangle" as const,
            bounds: report.zoneBounds!,
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
          <h2 className="text-gray-900">Crime Report Details</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Report Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-2">{report.title}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(
                      report.severity,
                    )}`}
                  >
                    {report.severity} Severity
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                      report.status,
                    )}`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>
              {userRole === "Reporter" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(report)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">Crime Type</p>
                  <p className="text-gray-900 mt-1">{report.type}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">Location</p>
                  <p className="text-gray-900 mt-1">{report.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">Incident Date</p>
                  <p className="text-gray-900 mt-1">
                    {new Date(report.incidentDate).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-2">Description</p>
                <p className="text-gray-900">{report.description}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-2">Reported By</p>
                <p className="text-gray-900">{report.reportedBy}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {new Date(report.reportedDate).toLocaleString()}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-2">Zone Information</p>
                <p className="text-gray-900">
                  Type:{" "}
                  {report.zoneType === "circle"
                    ? "Circular Zone"
                    : "Rectangular Zone"}
                </p>
                {report.zoneType === "circle" && (
                  <p className="text-gray-600 text-sm mt-1">
                    Radius: {report.zoneRadius} meters
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <h3 className="text-gray-900 mb-4">Crime Zone Map</h3>
            <MapView
              center={report.coordinates}
              markers={[
                {
                  position: report.coordinates,
                  label: report.location,
                },
              ]}
              zones={zones}
            />
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Crime Report"
          message={`Are you sure you want to delete this crime report? Title: ${report.title}. Type: ${report.type}. Location: ${report.location}.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(false)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </>
  );
}
