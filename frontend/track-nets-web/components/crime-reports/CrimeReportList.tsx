"use client";

import { Eye, Trash2, Shield } from "lucide-react";
import { useState, memo } from "react";
import type { CrimeReport } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";

interface CrimeReportListProps {
  reports: CrimeReport[];
  onViewDetail: (report: CrimeReport) => void;
  onEdit: (report: CrimeReport) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

export const CrimeReportList = memo(function CrimeReportList({
  reports,
  onViewDetail,
  onDelete,
  userRole,
}: CrimeReportListProps) {
  const [confirmDelete, setConfirmDelete] = useState<CrimeReport | null>(null);

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      onDelete(confirmDelete.id);
      setConfirmDelete(null);
    }
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

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No Crime Reports Found"
        description="There are no crime reports matching your current filters. Try adjusting your search criteria or create a new report."
      />
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-gray-700">Location</th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Incident Date
                </th>
                <th className="px-6 py-3 text-left text-gray-700">Severity</th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report, index) => (
                <AnimatedListItem key={report.id} index={index}>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{report.title}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{report.type}</td>
                  <td className="px-6 py-4 text-gray-900">{report.location}</td>
                  <td className="px-6 py-4 text-gray-900">
                    {new Date(report.incidentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(
                        report.severity,
                      )}`}
                    >
                      {report.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                        report.status,
                      )}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetail(report)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {userRole === "Reporter" && (
                        <>
                          <button
                            onClick={() => setConfirmDelete(report)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </AnimatedListItem>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Crime Report"
          message={`Are you sure you want to delete this crime report? Title: ${confirmDelete.title}. Type: ${confirmDelete.type}. Location: ${confirmDelete.location}.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </>
  );
});
