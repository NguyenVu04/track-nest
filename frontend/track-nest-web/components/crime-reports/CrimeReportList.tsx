"use client";

import { Eye, Trash2, Shield, CheckCircle, Globe } from "lucide-react";
import { useState, memo } from "react";
import type { CrimeReport, UserRole } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";
import { useTranslations } from "next-intl";

interface CrimeReportListProps {
  reports: CrimeReport[];
  onViewDetail: (report: CrimeReport) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: UserRole[];
}

const SEVERITY_STYLE: Record<
  number,
  { bg: string; text: string; dot: string }
> = {
  1: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  2: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-400" },
  3: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  4: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  5: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const SEVERITY_KEYS: Record<number, string> = {
  1: "severityVeryLow",
  2: "severityLow",
  3: "severityMedium",
  4: "severityHigh",
  5: "severityVeryHigh",
};

function SeverityBadge({ severity }: { severity: number }) {
  const t = useTranslations("crimeReports");
  const style = SEVERITY_STYLE[severity] ?? {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
  };
  const labelKey = SEVERITY_KEYS[severity] ?? "severityMedium";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {t(labelKey as Parameters<typeof t>[0])}
    </span>
  );
}

function getContentPreview(content: string) {
  if (!content) return "";
  const trimmed = content.trim();
  if (trimmed.startsWith("<")) return trimmed.replace(/<[^>]+>/g, " ").trim();
  if (trimmed.startsWith("http") || trimmed.endsWith(".html"))
    return "HTML content";
  return trimmed;
}

export const CrimeReportList = memo(function CrimeReportList({
  reports,
  onViewDetail,
  onPublish,
  onDelete,
  userRole,
}: CrimeReportListProps) {
  const t = useTranslations("crimeReports");
  const tCommon = useTranslations("common");

  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "delete";
    report: CrimeReport;
  } | null>(null);

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
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
                {[
                  t("tableReport"),
                  t("tableDate"),
                  t("tableSeverity"),
                  t("tableVictims"),
                  t("tableOffenders"),
                  t("tableArrested"),
                  tCommon("actions"),
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report, index) => (
                <AnimatedListItem key={report.id} index={index}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 leading-tight">
                        {report.title}
                      </p>
                      {report.isPublic && (
                        <Globe className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                      {getContentPreview(report.content).slice(0, 60)}…
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-medium">
                    {report.numberOfVictims}
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-medium">
                    {report.numberOfOffenders}
                  </td>
                  <td className="px-5 py-4">
                    {report.arrested ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> {tCommon("yes")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {tCommon("no")}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewDetail(report)}
                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                        title={tCommon("viewDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(userRole.includes("Reporter") ||
                        userRole.includes("User")) && (
                        <>
                          {!report.isPublic && (
                            <button
                              onClick={() =>
                                setConfirmAction({ type: "publish", report })
                              }
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title={tCommon("publish")}
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setConfirmAction({ type: "delete", report })
                            }
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title={tCommon("delete")}
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
          title={t("publishTitle")}
          message={t("publishMessage", { title: confirmAction.report.title })}
          onConfirm={() => {
            onPublish(confirmAction.report.id);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("publish")}
          confirmStyle="primary"
        />
      )}
      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title={t("deleteTitle")}
          message={t("deleteMessage", { title: confirmAction.report.title })}
          onConfirm={() => {
            onDelete(confirmAction.report.id);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("delete")}
          confirmStyle="danger"
        />
      )}
    </>
  );
});
