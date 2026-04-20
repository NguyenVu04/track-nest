"use client";

import { Eye, CheckCircle, Trash2, Users, Calendar, Phone, Mail } from "lucide-react";
import { useState, memo } from "react";
import type { MissingPerson } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";
import { useTranslations } from "next-intl";

interface MissingPersonListProps {
  persons: MissingPerson[];
  onViewDetail: (person: MissingPerson) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:   { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  PUBLISHED: { bg: "bg-brand-50",  text: "text-brand-700",  dot: "bg-brand-500"  },
  RESOLVED:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  REJECTED:  { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500"    },
  DELETED:   { bg: "bg-slate-50",  text: "text-slate-500",  dot: "bg-slate-400"  },
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("status");
  const style = STATUS_STYLE[status] ?? { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
  const label = t(status.toLowerCase() as Parameters<typeof t>[0]);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {label}
    </span>
  );
}

export const MissingPersonList = memo(function MissingPersonList({
  persons,
  onViewDetail,
  onPublish,
  onDelete,
  userRole,
}: MissingPersonListProps) {
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");

  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "delete";
    id: string;
    title: string;
  } | null>(null);

  if (persons.length === 0) {
    return (
      <EmptyState
        icon={Users}
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
                {[t("tableReport"), t("tableFullName"), t("tableDate"), t("tableContact"), t("tableStatus"), t("tableActions")].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {persons.map((person, index) => (
                <AnimatedListItem key={person.id} index={index}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900 leading-tight">{person.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                      {person.content.substring(0, 60)}…
                    </p>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800 whitespace-nowrap">
                    {person.fullName}
                  </td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {new Date(person.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      {person.contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" /> {person.contactPhone}
                        </span>
                      )}
                      {person.contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" /> {person.contactEmail}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={person.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewDetail(person)}
                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                        title={tCommon("viewDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(userRole === "Reporter" || userRole === "User") && (
                        <>
                          {person.status === "PENDING" && (
                            <button
                              onClick={() => setConfirmAction({ type: "publish", id: person.id, title: person.title })}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title={tCommon("publish")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmAction({ type: "delete", id: person.id, title: person.title })}
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
          message={t("publishMessage", { title: confirmAction.title })}
          onConfirm={() => { onPublish(confirmAction.id); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("publish")}
          confirmStyle="primary"
        />
      )}
      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title={t("deleteTitle")}
          message={t("deleteMessage", { title: confirmAction.title })}
          onConfirm={() => { onDelete(confirmAction.id); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
          confirmText={tCommon("delete")}
          confirmStyle="danger"
        />
      )}
    </>
  );
});
