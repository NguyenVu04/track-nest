"use client";

import { useState } from "react";
import { Plus, Trash2, Search, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { SafeZone } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { MapView } from "@/components/shared/MapView";
import { toast } from "sonner";

const mockZones: SafeZone[] = [
  {
    id: "zone-001",
    name: "Central Police Station",
    type: "Police Station",
    address: "12 Main Street, Central District",
    coordinates: [40.7527, -73.9772],
    createdAt: "2026-01-01T09:00:00Z",
  },
  {
    id: "zone-002",
    name: "City Hospital",
    type: "Hospital",
    address: "200 Health Ave, Downtown",
    coordinates: [40.745, -73.99],
    createdAt: "2026-01-02T11:30:00Z",
  },
];

export default function SafeZonesPage() {
  const { user } = useAuth();
  const [zones, setZones] = useState<SafeZone[]>(mockZones);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SafeZone | null>(null);
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Police Station",
    address: "",
    latitude: "",
    longitude: "",
  });

  if (!user) return null;

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async () => {
    try {
      await mockRequest(false);
      const newZone: SafeZone = {
        id: `zone-${Date.now()}`,
        name: formData.name,
        type: formData.type as SafeZone["type"],
        address: formData.address,
        coordinates: [
          parseFloat(formData.latitude),
          parseFloat(formData.longitude),
        ],
        createdAt: new Date().toISOString(),
      };
      setZones([newZone, ...zones]);
      setIsCreating(false);
      setFormData({
        name: "",
        type: "Police Station",
        address: "",
        latitude: "",
        longitude: "",
      });
      toast.success("Thêm mới thành công");
    } catch (error) {
      toast.error("Lỗi khi thêm khu vực an toàn");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await mockRequest(false);
      setZones(zones.filter((z) => z.id !== confirmDelete.id));
      setConfirmDelete(null);
      toast.success("Xóa thành công");
    } catch (error) {
      toast.error("Gặp lỗi khi xóa khu vực");
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-xl font-semibold">Safe Zones</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Safe Zone
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search safe zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-gray-700">Address</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredZones.map((zone) => (
                <tr
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedZone?.id === zone.id ? "bg-indigo-50" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      {zone.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{zone.type}</td>
                  <td className="px-6 py-4 text-gray-900">{zone.address}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(zone);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Safe Zone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-gray-900 font-semibold">
            {selectedZone
              ? `${selectedZone.name} Location`
              : "All Safe Zones Map"}
          </h3>
        </div>
        <div className="h-128">
          <MapView
            center={
              selectedZone
                ? (selectedZone.coordinates as [number, number])
                : [40.7489, -73.968]
            }
            markers={
              selectedZone
                ? [
                    {
                      position: selectedZone.coordinates as [number, number],
                      label: selectedZone.name,
                      popup: `${selectedZone.name}\n${selectedZone.address}`,
                    },
                  ]
                : zones.map((zone) => ({
                    position: zone.coordinates as [number, number],
                    label: zone.name,
                    popup: `${zone.name}\n${zone.address}`,
                  }))
            }
          />
        </div>
        {selectedZone && (
          <div className="p-4 border-t border-gray-200 bg-indigo-50">
            <button
              onClick={() => setSelectedZone(null)}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ← Show All Safe Zones
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-gray-900">Add Safe Zone</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Name *</label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                  required
                >
                  <option value="Police Station">Police Station</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Shelter">Shelter</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Address *</label>
                <input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsCreating(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  !formData.name ||
                  !formData.address ||
                  !formData.latitude ||
                  !formData.longitude
                }
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Safe Zone"
          message={`Are you sure you want to delete this safe zone?\n\nName: ${confirmDelete.name}\nAddress: ${confirmDelete.address}`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
