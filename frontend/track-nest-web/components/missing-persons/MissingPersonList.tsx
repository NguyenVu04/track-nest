"use client";

import { Eye, CheckCircle, Trash2, Users, Filter, Plus } from "lucide-react";
import { useState, memo } from "react";
import type { MissingPerson, UserRole } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/components/ui/utils";
import { Button } from "../ui/button";

interface MissingPersonListProps {
  persons: MissingPerson[];
  onViewDetail: (person: MissingPerson) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: UserRole[];
}

const STATUS_MAP: Record<
  string,
  { label: string; dot: string; shadow: string }
> = {
  PUBLISHED: {
    label: "Active Search",
    dot: "bg-red-500",
    shadow: "shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  },
  PENDING: {
    label: "Pending",
    dot: "bg-amber-400",
    shadow: "shadow-[0_0_8px_rgba(251,191,36,0.5)]",
  },
  RESOLVED: {
    label: "Found",
    dot: "bg-gray-400",
    shadow: "",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-slate-400",
    shadow: "",
  },
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
      <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                {[
                  "SUBJECT INFO",
                  "DATE REPORTED",
                  "CONTACT LEAD",
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
              {persons.map((person, index) => {
                const status = STATUS_MAP[person.status] ?? STATUS_MAP.PENDING;
                const date = new Date(person.date);
                const formattedDate = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const formattedTime = date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });
                const caseId = `#TRK-${person.id.slice(-4).toUpperCase()}`;

                return (
                  <AnimatedListItem
                    key={person.id}
                    index={index}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 rounded-xl border border-gray-100 shadow-sm shrink-0">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${person.fullName}`}
                          />
                          <AvatarFallback className="bg-brand-50 text-brand-600 font-black text-xs rounded-xl">
                            {person.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-gray-800 leading-tight group-hover:text-brand-600 transition-colors">
                            {person.fullName}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                            {caseId} · {person.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-800">
                        {formattedDate}
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {formattedTime}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-800">
                        {person.contactPhone || "—"}
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {person.contactEmail || ""}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            status.dot,
                            status.shadow,
                          )}
                        />
                        <span className="text-sm font-bold text-gray-700">
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onViewDetail(person)}
                          className="p-2 rounded-xl text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-all"
                          title={tCommon("viewDetails")}
                        >
                          <Eye className="w-5 h-5" />
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
                                className="p-2 rounded-xl text-gray-400 hover:text-teal-500 hover:bg-teal-50 transition-all"
                                title={tCommon("publish")}
                              >
                                <CheckCircle className="w-5 h-5" />
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
