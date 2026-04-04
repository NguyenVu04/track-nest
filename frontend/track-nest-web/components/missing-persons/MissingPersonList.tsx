"use client";

import { Eye, CheckCircle, Trash2, Users, Calendar, MapPin, Phone, Mail } from "lucide-react";
import { useState, memo } from "react";
import type { MissingPerson } from "@/types";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AnimatedListItem } from "../animations/AnimatedListItem";
import { EmptyState } from "../shared/EmptyState";

interface MissingPersonListProps {
  persons: MissingPerson[];
  onViewDetail: (person: MissingPerson) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

export const MissingPersonList = memo(function MissingPersonList({
  persons,
  onViewDetail,
  onPublish,
  onDelete,
  userRole,
}: MissingPersonListProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "delete";
    id: string;
  } | null>(null);

  const handleConfirmPublish = () => {
    if (confirmAction) {
      onPublish(confirmAction.id);
      setConfirmAction(null);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmAction) {
      onDelete(confirmAction.id);
      setConfirmAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PUBLISHED":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "DELETED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "PUBLISHED":
        return "Published";
      case "RESOLVED":
        return "Resolved";
      case "DELETED":
        return "Deleted";
      default:
        return status;
    }
  };

  if (persons.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Missing Person Reports Found"
        description="There are currently no missing person reports. When new reports are submitted, they will appear here."
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
                <th className="px-6 py-3 text-left text-gray-700">Full Name</th>
                <th className="px-6 py-3 text-left text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-gray-700">Contact</th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {persons.map((person, index) => (
                <AnimatedListItem key={person.id} index={index}>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">{person.title}</div>
                    <div className="text-gray-500 text-sm truncate max-w-xs">
                      {person.content.substring(0, 50)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{person.fullName}</td>
                  <td className="px-6 py-4 text-gray-900">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(person.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-sm">
                      {person.contactPhone && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3 h-3" />
                          {person.contactPhone}
                        </div>
                      )}
                      {person.contactEmail && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="w-3 h-3" />
                          {person.contactEmail}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                        person.status,
                      )}`}
                    >
                      {getStatusLabel(person.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetail(person)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {userRole === "Reporter" && (
                        <>
                          {person.status === "PENDING" && (
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: "publish",
                                  id: person.id,
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
                                id: person.id,
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
          title="Publish Missing Person Report"
          message="Are you sure you want to publish this report? This will notify Emergency Services and the reported user."
          onConfirm={handleConfirmPublish}
          onCancel={() => setConfirmAction(null)}
          confirmText="Publish"
          confirmStyle="primary"
        />
      )}

      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title="Delete Missing Person Report"
          message="Are you sure you want to delete this report? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmAction(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </>
  );
});
