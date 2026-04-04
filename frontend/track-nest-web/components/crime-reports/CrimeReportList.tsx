"use client";

import { Eye, Trash2, Shield, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { useState, memo } from "react";
import type { CrimeReport } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";

interface CrimeReportListProps {
  reports: CrimeReport[];
  onViewDetail: (report: CrimeReport) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

export const CrimeReportList = memo(function CrimeReportList({
  reports,
  onViewDetail,
  onPublish,
  onDelete,
  userRole,
}: CrimeReportListProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "delete";
    report: CrimeReport;
  } | null>(null);

  const handleConfirmPublish = () => {
    if (confirmAction) {
      onPublish(confirmAction.report.id);
      setConfirmAction(null);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmAction) {
      onDelete(confirmAction.report.id);
      setConfirmAction(null);
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-lime-100 text-lime-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
        return "bg-orange-100 text-orange-800";
      case 5:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 1:
        return "Very Low";
      case 2:
        return "Low";
      case 3:
        return "Medium";
      case 4:
        return "High";
      case 5:
        return "Very High";
      default:
        return "Unknown";
    }
  };

  const getSeverityIcon = (severity: number) => {
    switch (severity) {
      case 1:
      case 2:
        return <AlertCircle className="w-4 h-4" />;
      case 3:
        return <AlertTriangle className="w-4 h-4" />;
      case 4:
      case 5:
        return <Shield className="w-4 h-4" />;
      default:
        return null;
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
                <th className="px-6 py-3 text-left text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-gray-700">Severity</th>
                <th className="px-6 py-3 text-left text-gray-700">Victims</th>
                <th className="px-6 py-3 text-left text-gray-700">Offenders</th>
                <th className="px-6 py-3 text-left text-gray-700">Arrested</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report, index) => (
                <AnimatedListItem key={report.id} index={index}>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">{report.title}</div>
                    <div className="text-gray-500 text-sm truncate max-w-xs">
                      {report.content.substring(0, 50)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit ${getSeverityColor(
                        report.severity,
                      )}`}
                    >
                      {getSeverityIcon(report.severity)}
                      {getSeverityLabel(report.severity)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {report.numberOfVictims}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {report.numberOfOffenders}
                  </td>
                  <td className="px-6 py-4">
                    {report.arrested ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
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
                          {!report.isPublic && (
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: "publish",
                                  report,
                                })
                              }
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Publish Report"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setConfirmAction({
                                type: "delete",
                                report,
                              })
                            }
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

      {confirmAction?.type === "publish" && (
        <ConfirmModal
          title="Publish Crime Report"
          message={`Are you sure you want to publish this crime report? "${confirmAction.report.title}" will be visible to all users.`}
          onConfirm={handleConfirmPublish}
          onCancel={() => setConfirmAction(null)}
          confirmText="Publish"
          confirmStyle="primary"
        />
      )}

      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title="Delete Crime Report"
          message={`Are you sure you want to delete this crime report? "${confirmAction.report.title}" will be permanently removed.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmAction(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </>
  );
});
