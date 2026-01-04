"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import type { CrimeReport } from "@/types";

interface CrimeReportFormProps {
  report: CrimeReport | null;
  onSave: (report: CrimeReport) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function CrimeReportForm({
  report,
  onSave,
  onCancel,
  mode,
}: CrimeReportFormProps) {
  const [formData, setFormData] = useState<Partial<CrimeReport>>(
    report || {
      title: "",
      type: "Theft",
      description: "",
      location: "",
      incidentDate: new Date().toISOString().slice(0, 16),
      coordinates: [40.7829, -73.9654],
      zoneType: "circle",
      zoneRadius: 300,
      reportedBy: "",
      reportedDate: new Date().toISOString(),
      severity: "Medium",
      status: "Active",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: CrimeReport = {
      id: report?.id || Date.now().toString(),
      title: formData.title!,
      type: formData.type!,
      description: formData.description!,
      location: formData.location!,
      incidentDate: formData.incidentDate!,
      coordinates: formData.coordinates!,
      zoneType: formData.zoneType!,
      zoneRadius: formData.zoneRadius,
      zoneBounds: formData.zoneBounds,
      reportedBy: formData.reportedBy!,
      reportedDate: formData.reportedDate!,
      severity: formData.severity!,
      status: formData.status!,
    };
    onSave(newReport);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900">
          {mode === "create" ? "New Crime Report" : "Edit Crime Report"}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-gray-700 mb-2">
              Crime Type *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="Theft">Theft</option>
              <option value="Assault">Assault</option>
              <option value="Burglary">Burglary</option>
              <option value="Vandalism">Vandalism</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="severity" className="block text-gray-700 mb-2">
              Severity *
            </label>
            <select
              id="severity"
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: e.target.value as any })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-gray-700 mb-2">
              Status *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="Active">Active</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label htmlFor="incidentDate" className="block text-gray-700 mb-2">
              Incident Date *
            </label>
            <input
              id="incidentDate"
              type="datetime-local"
              value={formData.incidentDate?.slice(0, 16)}
              onChange={(e) =>
                setFormData({ ...formData, incidentDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="location" className="block text-gray-700 mb-2">
              Location *
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Parking Garage, 5th Avenue"
              required
            />
          </div>

          <div>
            <label htmlFor="latitude" className="block text-gray-700 mb-2">
              Latitude *
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              value={formData.coordinates?.[0] || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coordinates: [
                    parseFloat(e.target.value),
                    formData.coordinates?.[1] || 0,
                  ],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-gray-700 mb-2">
              Longitude *
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              value={formData.coordinates?.[1] || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  coordinates: [
                    formData.coordinates?.[0] || 0,
                    parseFloat(e.target.value),
                  ],
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="zoneType" className="block text-gray-700 mb-2">
              Zone Type *
            </label>
            <select
              id="zoneType"
              value={formData.zoneType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  zoneType: e.target.value as "circle" | "rectangle",
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="circle">Circular Zone</option>
              <option value="rectangle">Rectangular Zone</option>
            </select>
          </div>

          {formData.zoneType === "circle" ? (
            <div className="md:col-span-2">
              <label htmlFor="zoneRadius" className="block text-gray-700 mb-2">
                Zone Radius (meters) *
              </label>
              <input
                id="zoneRadius"
                type="number"
                value={formData.zoneRadius || 300}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    zoneRadius: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="boundsLat1"
                  className="block text-gray-700 mb-2"
                >
                  Bounds - Latitude 1 *
                </label>
                <input
                  id="boundsLat1"
                  type="number"
                  step="any"
                  value={formData.zoneBounds?.[0][0] || 0}
                  onChange={(e) => {
                    const bounds = formData.zoneBounds || [
                      [0, 0],
                      [0, 0],
                    ];
                    bounds[0][0] = parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      zoneBounds: [...bounds] as any,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="boundsLng1"
                  className="block text-gray-700 mb-2"
                >
                  Bounds - Longitude 1 *
                </label>
                <input
                  id="boundsLng1"
                  type="number"
                  step="any"
                  value={formData.zoneBounds?.[0][1] || 0}
                  onChange={(e) => {
                    const bounds = formData.zoneBounds || [
                      [0, 0],
                      [0, 0],
                    ];
                    bounds[0][1] = parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      zoneBounds: [...bounds] as any,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="boundsLat2"
                  className="block text-gray-700 mb-2"
                >
                  Bounds - Latitude 2 *
                </label>
                <input
                  id="boundsLat2"
                  type="number"
                  step="any"
                  value={formData.zoneBounds?.[1][0] || 0}
                  onChange={(e) => {
                    const bounds = formData.zoneBounds || [
                      [0, 0],
                      [0, 0],
                    ];
                    bounds[1][0] = parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      zoneBounds: [...bounds] as any,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="boundsLng2"
                  className="block text-gray-700 mb-2"
                >
                  Bounds - Longitude 2 *
                </label>
                <input
                  id="boundsLng2"
                  type="number"
                  step="any"
                  value={formData.zoneBounds?.[1][1] || 0}
                  onChange={(e) => {
                    const bounds = formData.zoneBounds || [
                      [0, 0],
                      [0, 0],
                    ];
                    bounds[1][1] = parseFloat(e.target.value);
                    setFormData({
                      ...formData,
                      zoneBounds: [...bounds] as any,
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4}
              placeholder="Detailed description of the incident..."
              required
            />
          </div>

          <div>
            <label htmlFor="reportedBy" className="block text-gray-700 mb-2">
              Reported By *
            </label>
            <input
              id="reportedBy"
              type="text"
              value={formData.reportedBy}
              onChange={(e) =>
                setFormData({ ...formData, reportedBy: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {mode === "create" ? "Create Report" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
