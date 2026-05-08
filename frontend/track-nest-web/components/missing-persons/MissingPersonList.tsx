"use client";

import {
  Eye,
  CheckCircle,
  Trash2,
  Users,
  Calendar,
  Phone,
  Mail,
  MoreVertical,
  Filter,
  Plus,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import { useState, memo, useMemo } from "react";
import type { MissingPerson, UserRole } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/ui/utils";

interface MissingPersonListProps {
  persons: MissingPerson[];
  onViewDetail: (person: MissingPerson) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: UserRole[];
  onCreateNew?: () => void; // Added to support the Create button in the header
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> =
  {
    PUBLISHED: {
      label: "Active Search",
      color: "text-red-500",
      bg: "bg-red-50",
    },
    PENDING: { label: "Pending", color: "text-brand-600", bg: "bg-brand-50" },
    RESOLVED: { label: "Found", color: "text-gray-500", bg: "bg-gray-100" },
    REJECTED: {
      label: "Rejected",
      color: "text-slate-500",
      bg: "bg-slate-100",
    },
  };

export const MissingPersonList = memo(function MissingPersonList({
  persons,
  onViewDetail,
  onPublish,
  onDelete,
  userRole,
  onCreateNew,
}: MissingPersonListProps) {
  const t = useTranslations("missingPersons");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<
    "ALL" | "PUBLISHED" | "PENDING" | "RESOLVED"
  >("ALL");
  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "delete";
    id: string;
    title: string;
  } | null>(null);

  const filteredPersons = useMemo(() => {
    if (activeTab === "ALL") return persons;
    return persons.filter((p) => p.status === activeTab);
  }, [persons, activeTab]);

  const tabs = [
    { id: "ALL", label: "All Reports" },
    { id: "PUBLISHED", label: "Active Search" },
    { id: "PENDING", label: "Pending" },
    { id: "RESOLVED", label: "Found" },
  ];

  if (persons.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Missing Person Reports
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Manage and track active search operations.
            </p>
          </div>
          <Button
            onClick={onCreateNew}
            className="rounded-2xl h-12 px-6 bg-brand-700 text-white hover:bg-brand-800 font-black"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Report
          </Button>
        </div>
        <EmptyState
          icon={Users}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Redesigned Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Missing Person Reports
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage and track active search operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-2xl h-12 px-6 border-gray-100 text-gray-600 font-bold hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button
            onClick={onCreateNew}
            className="rounded-2xl h-12 px-6 bg-brand-700 text-white hover:bg-brand-800 font-black shadow-lg shadow-brand-700/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              activeTab === tab.id
                ? "bg-brand-200 text-brand-800 shadow-sm"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Container */}
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
            <tbody className="space-y-4">
              {filteredPersons.map((person, index) => {
                const status = STATUS_MAP[person.status] || STATUS_MAP.PENDING;
                const date = new Date(person.date);

                return (
                  <AnimatedListItem
                    key={person.id}
                    index={index}
                    className="contents group bg-white rounded-3xl transition-all hover:shadow-xl hover:shadow-gray-200/50"
                  >
                    <td className="px-6 py-5 rounded-l-3xl first:border-l-0">
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
                            Case #TRK-
                            {person.id.substring(0, 4).toUpperCase()} • Age 24
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
                        John Doe
                      </p>
                      <p className="text-[11px] font-bold text-gray-400">
                        {person.contactPhone || "+1 (555) 000-0000"}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-10 w-10 p-0 rounded-xl hover:bg-gray-50"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-2xl border-gray-100 shadow-xl p-2 min-w-[160px]"
                        >
                          <DropdownMenuItem
                            onClick={() => onViewDetail(person)}
                            className="rounded-xl py-3 px-4 font-bold text-gray-600 cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-3" />
                            View Details
                          </DropdownMenuItem>
                          {(userRole.includes("Reporter") ||
                            userRole.includes("User")) && (
                            <>
                              {person.status === "PENDING" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setConfirmAction({
                                      type: "publish",
                                      id: person.id,
                                      title: person.fullName,
                                    })
                                  }
                                  className="rounded-xl py-3 px-4 font-bold text-green-600 cursor-pointer"
                                >
                                  <CheckCircle className="w-4 h-4 mr-3" />
                                  Publish Report
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-gray-50 my-1" />
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({
                                    type: "delete",
                                    id: person.id,
                                    title: person.fullName,
                                  })
                                }
                                className="rounded-xl py-3 px-4 font-bold text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete Report
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          title="Publish Report"
          message={`Are you sure you want to publish the report for ${confirmAction.title}?`}
          onConfirm={() => {
            onPublish(confirmAction.id);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
          confirmText="Publish"
          confirmStyle="primary"
        />
      )}
      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title="Delete Report"
          message={`Are you sure you want to delete the report for ${confirmAction.title}? This action cannot be undone.`}
          onConfirm={() => {
            onDelete(confirmAction.id);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </div>
  );
});
