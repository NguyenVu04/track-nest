"use client";

import { Eye, CheckCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import type { MissingPerson } from "@/types";
import { ConfirmModal } from "./ConfirmModal";

interface MissingPersonListProps {
  persons: MissingPerson[];
  onViewDetail: (person: MissingPerson) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

export function MissingPersonList({
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
      case "Unhandled":
        return "bg-yellow-100 text-yellow-800";
      case "Published":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (persons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No missing person reports found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-gray-700">Age</th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Last Seen Location
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Last Seen Date
                </th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {persons.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{person.name}</div>
                    <div className="text-gray-500 text-sm">{person.gender}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{person.age}</td>
                  <td className="px-6 py-4 text-gray-900">
                    {person.lastSeenLocation}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {new Date(person.lastSeenDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                        person.status
                      )}`}
                    >
                      {person.status}
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
                          {person.status === "Unhandled" && (
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
                </tr>
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
}
