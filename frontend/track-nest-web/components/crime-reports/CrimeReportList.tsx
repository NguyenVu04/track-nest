"use client";

import { Eye, Trash2, Shield, CheckCircle, Globe, MapPin, Calendar, Clock, Edit, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { useState, memo } from "react";
import type { CrimeReport, UserRole } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";
import { useTranslations } from "next-intl";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CrimeReportListProps {
  reports: CrimeReport[];
  onViewDetail: (report: CrimeReport) => void;
  onEdit?: (report: CrimeReport) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: UserRole[];
}

const SEVERITY_STYLE: Record<
  number,
  { bg: string; text: string; dot: string; label: string }
> = {
  1: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500", label: "Low" },
  2: { bg: "bg-teal-50", text: "text-teal-600", dot: "bg-teal-500", label: "Low" },
  3: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500", label: "Medium" },
  4: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "High" },
  5: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "High" },
};

function SeverityBadge({ severity }: { severity: number }) {
  const style = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE[3];
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm border border-black/5",
        style.bg, style.text
      )}
    >
      {style.label}
    </span>
  );
}

export const CrimeReportList = memo(function CrimeReportList({
  reports,
  onViewDetail,
  onEdit,
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

  const getIncidentIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("vandalism") || t.includes("graffiti")) return <div className="p-2 bg-red-50 rounded-lg"><Shield className="w-4 h-4 text-red-400" /></div>;
    if (t.includes("vehicle") || t.includes("car")) return <div className="p-2 bg-blue-50 rounded-lg"><Shield className="w-4 h-4 text-blue-400" /></div>;
    if (t.includes("noise") || t.includes("loud")) return <div className="p-2 bg-teal-50 rounded-lg"><Shield className="w-4 h-4 text-teal-400" /></div>;
    return <div className="p-2 bg-gray-50 rounded-lg"><Shield className="w-4 h-4 text-gray-400" /></div>;
  };

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                {[
                  "INCIDENT DETAILS",
                  "DATE & TIME",
                  "SEVERITY",
                  "LOCATION",
                  "STATUS",
                  "ACTIONS",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((report, index) => {
                 const dateObj = new Date(report.date);
                 const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                 const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                 const reportId = `#TRK-${report.id.slice(-4).toUpperCase()}`;

                 return (
                   <AnimatedListItem key={report.id} index={index} className="hover:bg-gray-50/50 transition-colors group">
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                         {getIncidentIcon(report.title)}
                         <div>
                           <p className="font-bold text-gray-800 leading-tight group-hover:text-brand-600 transition-colors">
                             {report.title}
                           </p>
                           <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                             ID: {reportId}
                           </p>
                         </div>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <p className="text-sm font-bold text-gray-800">{formattedDate}</p>
                       <p className="text-xs text-gray-400 font-medium mt-0.5">{formattedTime}</p>
                     </td>
                     <td className="px-8 py-6">
                       <SeverityBadge severity={report.severity} />
                     </td>
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                         <MapPin className="w-4 h-4 text-gray-300 shrink-0" />
                         <p className="text-sm font-bold text-gray-600 truncate max-w-[150px]">
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                         </p>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                         <div className={cn(
                           "w-2 h-2 rounded-full",
                           report.isPublic ? "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                         )} />
                         <span className="text-sm font-bold text-gray-700">
                           {report.isPublic ? "Active" : "Draft"}
                         </span>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                         <button
                           onClick={() => onViewDetail(report)}
                           className="p-2 rounded-xl text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-all"
                           title={tCommon("viewDetails")}
                         >
                           <Eye className="w-5 h-5" />
                         </button>
                         {(userRole.includes("Reporter") || userRole.includes("User")) && (
                           <>
                             {!report.isPublic && (
                               <button
                                 onClick={() => setConfirmAction({ type: "publish", report })}
                                 className="p-2 rounded-xl text-gray-400 hover:text-teal-500 hover:bg-teal-50 transition-all"
                                 title={tCommon("publish")}
                               >
                                 <Globe className="w-5 h-5" />
                               </button>
                             )}
                             <button
                               onClick={() => onEdit?.(report)}
                               className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                               title={tCommon("edit")}
                             >
                               <Edit className="w-5 h-5" />
                             </button>
                             <button
                               onClick={() => setConfirmAction({ type: "delete", report })}
                               className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                               title={tCommon("delete")}
                             >
                               <Trash2 className="w-5 h-5" />
                             </button>
                           </>
                         )}
                       </div>
                     </td>
                   </AnimatedListItem>
                 );
              })}
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
