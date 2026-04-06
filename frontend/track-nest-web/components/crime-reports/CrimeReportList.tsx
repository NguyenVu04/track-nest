"use client";

import { Eye, Trash2, Shield, CheckCircle, AlertTriangle, AlertCircle, Globe } from "lucide-react";
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

const SEVERITY_CONFIG: Record<number, { label: string; bg: string; text: string; dot: string }> = {
  1: { label: "Very Low", bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400"  },
  2: { label: "Low",      bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-400"   },
  3: { label: "Medium",   bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  4: { label: "High",     bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  5: { label: "Very High",bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500"    },
};

function SeverityBadge({ severity }: { severity: number }) {
  const cfg = SEVERITY_CONFIG[severity] ?? { label: "Unknown", bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Report</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Victims</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Offenders</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Arrested</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report, index) => (
                <AnimatedListItem key={report.id} index={index}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 leading-tight">{report.title}</p>
                      {report.isPublic && (
                        <Globe className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                      {report.content.substring(0, 60)}…
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-medium">{report.numberOfVictims}</td>
                  <td className="px-5 py-4 text-slate-700 font-medium">{report.numberOfOffenders}</td>
                  <td className="px-5 py-4">
                    {report.arrested ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewDetail(report)}
                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {userRole === "Reporter" && (
                        <>
                          {!report.isPublic && (
                            <button
                              onClick={() => setConfirmAction({ type: "publish", report })}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title="Publish"
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmAction({ type: "delete", report })}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
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
          message={`"${confirmAction.report.title}" will be visible to all users.`}
          onConfirm={() => { onPublish(confirmAction.report.id); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
          confirmText="Publish"
          confirmStyle="primary"
        />
      )}
      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title="Delete Crime Report"
          message={`"${confirmAction.report.title}" will be permanently removed. This cannot be undone.`}
          onConfirm={() => { onDelete(confirmAction.report.id); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </>
  );
});
