"use client";

import { Eye, CheckCircle, Trash2, Users } from "lucide-react";
import { useState, memo } from "react";
import type { MissingPerson, UserRole } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

interface MissingPersonListProps {
  persons: MissingPerson[];
  onViewDetail: (person: MissingPerson) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: UserRole[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PUBLISHED: { label: "Active Search", color: "text-red-500",   bg: "bg-red-50"    },
  PENDING:   { label: "Pending",       color: "text-brand-600", bg: "bg-brand-50"  },
  RESOLVED:  { label: "Found",         color: "text-gray-500",  bg: "bg-gray-100"  },
  REJECTED:  { label: "Rejected",      color: "text-slate-500", bg: "bg-slate-100" },
};

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
      <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="text-left px-6 pb-6">Subject Info</th>
                <th className="text-left px-6 pb-6">Date Reported</th>
                <th className="text-left px-6 pb-6">Contact Lead</th>
                <th className="text-left px-6 pb-6">Status</th>
                <th className="text-right px-6 pb-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((person, index) => {
                const status = STATUS_MAP[person.status] ?? STATUS_MAP.PENDING;
                const date = new Date(person.date);
                return (
                  <AnimatedListItem
                    key={person.id}
                    index={index}
                    className="contents group bg-white rounded-3xl transition-all hover:shadow-xl hover:shadow-gray-200/50"
                  >
                    <td className="px-6 py-5 rounded-l-3xl">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 rounded-2xl border-2 border-brand-50 shadow-sm">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${person.fullName}`}
                          />
                          <AvatarFallback className="bg-brand-50 text-brand-600 font-black">
                            {person.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-black text-gray-900 leading-none mb-1">
                            {person.fullName}
                          </p>
                          <p className="text-[11px] font-bold text-gray-400">
                            Case #TRK-{person.id.substring(0, 4).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-gray-900 text-sm">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] font-bold text-gray-400">
                        {date.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-gray-900 text-sm">
                        {person.contactPhone || "—"}
                      </p>
                      <p className="text-[11px] font-bold text-gray-400">
                        {person.contactEmail || ""}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full px-3 py-1 font-bold text-[10px] uppercase flex items-center gap-1.5 w-fit border-none",
                          status.bg,
                          status.color,
                        )}
                      >
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status.color.replace("text-", "bg-"),
                          )}
                        />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right rounded-r-3xl">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewDetail(person)}
                          className="p-2 rounded-xl text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(userRole.includes("Reporter") ||
                          userRole.includes("User")) && (
                          <>
                            {person.status === "PENDING" && (
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: "publish",
                                    id: person.id,
                                    title: person.title,
                                  })
                                }
                                className="p-2 rounded-xl text-gray-400 hover:text-green-500 hover:bg-green-50 transition-all"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: "delete",
                                  id: person.id,
                                  title: person.title,
                                })
                              }
                              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    {/* Spacer row */}
                    <tr className="h-3">
                      <td colSpan={5}></td>
                    </tr>
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
          message={t("publishMessage", { title: confirmAction.title })}
          onConfirm={() => {
            onPublish(confirmAction.id);
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
          message={t("deleteMessage", { title: confirmAction.title })}
          onConfirm={() => {
            onDelete(confirmAction.id);
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
