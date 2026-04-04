"use client";

import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Trash2,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { useState } from "react";
import type { MissingPerson } from "@/types";
import { MapView } from "../shared/MapView";
import { ConfirmModal } from "../shared/ConfirmModal";

interface MissingPersonDetailProps {
  person: MissingPerson;
  onBack: () => void;
  onEdit: (person: MissingPerson) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

export function MissingPersonDetail({
  person,
  onBack,
  onEdit,
  onPublish,
  onDelete,
  userRole,
}: MissingPersonDetailProps) {
  const [confirmAction, setConfirmAction] = useState<
    "publish" | "delete" | null
  >(null);

  const handleConfirmPublish = () => {
    onPublish(person.id);
    setConfirmAction(null);
  };

  const handleConfirmDelete = () => {
    onDelete(person.id);
    setConfirmAction(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PUBLISHED":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center gap-4 mb-6 text-black">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-gray-900">Missing Person Details</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Person Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-gray-900 mb-2">{person.fullName}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    person.status,
                  )}`}
                >
                  {person.status}
                </span>
              </div>
              {userRole === "Reporter" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(person)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {person.status === "PENDING" && (
                    <button
                      onClick={() => setConfirmAction("publish")}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Publish Report"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmAction("delete")}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">Name</p>
                  <p className="text-gray-900 mt-1">{person.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">Personal ID</p>
                  <p className="text-gray-900 mt-1">{person.personalId}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-700">Date</p>
                  <p className="text-gray-900 mt-1">
                    {new Date(person.date).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-2">Description</p>
                <p className="text-gray-900">{person.content}</p>
              </div>

              {person.photo && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-700 mb-2">Photo</p>
                  <img
                    src={person.photo}
                    alt={person.fullName}
                    className="w-full max-w-xs rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
            <h3 className="text-gray-900 mb-4">Last Known Location Map</h3>
            <MapView
              center={[40.7829, -73.9654]}
              markers={[
                {
                  position: [40.7829, -73.9654] as [number, number],
                  label: person.fullName,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {confirmAction === "publish" && (
        <ConfirmModal
          title="Publish Missing Person Report"
          message="Are you sure you want to publish this report? This will notify Emergency Services and the reported user."
          onConfirm={handleConfirmPublish}
          onCancel={() => setConfirmAction(null)}
          confirmText="Publish"
          confirmStyle="primary"
        />
      )}

      {confirmAction === "delete" && (
        <ConfirmModal
          title="Delete Missing Person Report"
          message="Are you sure you want to delete this report? This action cannot be undone and the reported user will be notified."
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmAction(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </>
  );
}