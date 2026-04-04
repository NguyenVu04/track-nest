"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { SafeZone } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { MapView } from "@/components/shared/MapView";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { emergencyOpsService, SafeZoneResponse, PageResponse, CreateSafeZoneRequest } from "@/services/emergencyOpsService";
import { Loading } from "@/components/loading/Loading";

export default function SafeZonesPage() {
  const { user } = useAuth();
  const [zones, setZones] = useState<SafeZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    radius: "500",
  });

  useEffect(() => {
    const fetchZones = async () => {
      if (!user || user.role !== "Emergency Services") {
        setIsLoading(false);
        return;
      }

      try {
        const response: PageResponse<SafeZoneResponse> = await emergencyOpsService.getSafeZones(
          undefined,
          0,
          50
        );
        
        const mappedZones: SafeZone[] = response.content.map((item) => ({
          id: item.id,
          name: item.name,
          type: "Other",
          address: "",
          longitude: item.longitude,
          latitude: item.latitude,
          radius: item.radius,
          createdAt: item.createdAt,
          emergencyServiceId: item.emergencyServiceId,
        }));
        
        setZones(mappedZones);
      } catch (error) {
        console.error("Error fetching safe zones:", error);
        toast.error("Failed to load safe zones");
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, [user]);

  if (!user) return null;

  if (user.role !== "Emergency Services") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You need Emergency Services role to manage safe zones.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loading fullScreen />;
  }

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async () => {
    try {
      const request: CreateSafeZoneRequest = {
        name: formData.name,
        longitude: parseFloat(formData.longitude),
        latitude: parseFloat(formData.latitude),
        radius: parseFloat(formData.radius),
      };
      
      const response = await emergencyOpsService.createSafeZone(request);
      
      const newZone: SafeZone = {
        id: response.id,
        name: response.name,
        type: formData.type as SafeZone["type"],
        address: formData.address,
        longitude: response.longitude,
        latitude: response.latitude,
        radius: response.radius,
        createdAt: response.createdAt,
        emergencyServiceId: response.emergencyServiceId,
      };
      
      setZones([newZone, ...zones]);
      setIsCreating(false);
      setFormData({
        name: "",
        type: "Police Station",
        address: "",
        latitude: "",
        longitude: "",
        radius: "500",
      });
      toast.success("Safe zone created successfully");
    } catch (error) {
      toast.error("Error creating safe zone");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await emergencyOpsService.deleteSafeZone(confirmDelete.id);
      setZones(zones.filter((z) => z.id !== confirmDelete.id));
      setConfirmDelete(null);
      toast.success("Safe zone deleted successfully");
    } catch (error) {
      toast.error("Error deleting safe zone");
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: "Safe Zones" }]} />
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
                <th className="px-6 py-3 text-left text-gray-700">Coordinates</th>
                <th className="px-6 py-3 text-left text-gray-700">Radius (m)</th>
                <th className="px-6 py-3 text-left text-gray-700">Created</th>
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
                  <td className="px-6 py-4 text-gray-900 font-mono text-sm">
                    {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{zone.radius}m</td>
                  <td className="px-6 py-4 text-gray-900">
                    {new Date(zone.createdAt).toLocaleDateString()}
                  </td>
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
                ? [selectedZone.latitude, selectedZone.longitude]
                : [10.8231, 106.6297]
            }
            markers={
              selectedZone
                ? [
                    {
                      position: [selectedZone.latitude, selectedZone.longitude],
                      label: selectedZone.name,
                    },
                  ]
                : zones.map((zone) => ({
                    position: [zone.latitude, zone.longitude],
                    label: zone.name,
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
                <label className="block text-gray-700 mb-2">Address</label>
                <input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
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
              <div>
                <label className="block text-gray-700 mb-2">Radius (meters) *</label>
                <input
                  type="number"
                  step="any"
                  value={formData.radius}
                  onChange={(e) =>
                    setFormData({ ...formData, radius: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                  required
                />
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
                  !formData.latitude ||
                  !formData.longitude ||
                  !formData.radius
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
          message={`Are you sure you want to delete this safe zone?\n\nName: ${confirmDelete.name}`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
