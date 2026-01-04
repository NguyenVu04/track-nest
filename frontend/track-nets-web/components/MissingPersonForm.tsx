"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import type { MissingPerson } from "@/types";

interface MissingPersonFormProps {
  person: MissingPerson | null;
  onSave: (person: MissingPerson) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function MissingPersonForm({
  person,
  onSave,
  onCancel,
  mode,
}: MissingPersonFormProps) {
  const [formData, setFormData] = useState<Partial<MissingPerson>>(
    person || {
      name: "",
      age: 0,
      gender: "Male",
      description: "",
      lastSeenLocation: "",
      lastSeenDate: new Date().toISOString().slice(0, 16),
      coordinates: [40.7829, -73.9654],
      status: "Unhandled",
      reportedBy: "",
      reportedDate: new Date().toISOString(),
      contactInfo: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPerson: MissingPerson = {
      id: person?.id || Date.now().toString(),
      name: formData.name!,
      age: formData.age!,
      gender: formData.gender!,
      description: formData.description!,
      lastSeenLocation: formData.lastSeenLocation!,
      lastSeenDate: formData.lastSeenDate!,
      coordinates: formData.coordinates!,
      status: formData.status!,
      reportedBy: formData.reportedBy!,
      reportedDate: formData.reportedDate!,
      contactInfo: formData.contactInfo!,
    };
    onSave(newPerson);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900">
          {mode === "create"
            ? "New Missing Person Report"
            : "Edit Missing Person Report"}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-gray-700 mb-2">
              Age *
            </label>
            <input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-gray-700 mb-2">
              Gender *
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="lastSeenDate" className="block text-gray-700 mb-2">
              Last Seen Date *
            </label>
            <input
              id="lastSeenDate"
              type="datetime-local"
              value={formData.lastSeenDate?.slice(0, 16)}
              onChange={(e) =>
                setFormData({ ...formData, lastSeenDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="lastSeenLocation"
              className="block text-gray-700 mb-2"
            >
              Last Seen Location *
            </label>
            <input
              id="lastSeenLocation"
              type="text"
              value={formData.lastSeenLocation}
              onChange={(e) =>
                setFormData({ ...formData, lastSeenLocation: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Central Park, New York"
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
              placeholder="Physical description, clothing, distinguishing features..."
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

          <div>
            <label htmlFor="contactInfo" className="block text-gray-700 mb-2">
              Contact Information *
            </label>
            <input
              id="contactInfo"
              type="text"
              value={formData.contactInfo}
              onChange={(e) =>
                setFormData({ ...formData, contactInfo: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Phone number or email"
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
