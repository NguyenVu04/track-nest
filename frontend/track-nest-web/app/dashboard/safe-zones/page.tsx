"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { SafeZone } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { MapView } from "@/components/shared/MapView";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  emergencyOpsService,
  CreateSafeZoneRequest,
  CreateSafeZoneResponse,
  PageResponse,
  SafeZoneResponse,
} from "@/services/emergencyOpsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations } from "next-intl";

const DEFAULT_CENTER: [number, number] = [10.8231, 106.6297];

export default function SafeZonesPage() {
  const { user } = useAuth();
  const t = useTranslations("safeZones");
  const tCommon = useTranslations("common");

  const [zones, setZones] = useState<SafeZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SafeZone | null>(null);
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Police Station",
    address: "",
    radius: "500",
  });

  useEffect(() => {
    const fetchZones = async () => {
      // if (!user || user.role !== "Emergency Service") {
      //   setIsLoading(false);
      //   return;
      // }

      try {
        const response: PageResponse<SafeZoneResponse> =
          await emergencyOpsService.getSafeZones(undefined, 0, 50);

        const mappedZones: SafeZone[] = response.items.map((item) => ({
          id: item.id,
          name: item.name,
          type: "Other",
          address: "",
          longitude: item.longitude,
          latitude: item.latitude,
          radius: item.radius,
          createdAt: item.createdAt,
        }));

        setZones(mappedZones);
      } catch (error) {
        console.error("Error fetching safe zones:", error);
        toast.error(t("toastLoadError") || "Failed to load safe zones");
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, [user, t]);

  if (!user) return null;

  // if (user.role !== "Emergency Service") {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="text-center">
  //         <h3 className="text-lg font-semibold text-gray-900">{tCommon("accessDenied")}</h3>
  //         <p className="text-gray-500">{t("accessDeniedMessage")}</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return <Loading fullScreen />;
  }

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openCreateModal = () => {
    setSelectedLocation(DEFAULT_CENTER);
    setFormData({
      name: "",
      type: "Police Station",
      address: "",
      radius: "500",
    });
    setIsCreating(true);
  };

  const closeCreateModal = () => {
    setIsCreating(false);
    setSelectedLocation(null);
  };

  const handleCreate = async () => {
    try {
      if (!selectedLocation) {
        toast.error("Please choose a location on the map");
        return;
      }

      const [latitude, longitude] = selectedLocation;
      const request: CreateSafeZoneRequest = {
        name: formData.name,
        longitudeDegrees: longitude,
        latitudeDegrees: latitude,
        radiusMeters: parseFloat(formData.radius),
      };

      const response: CreateSafeZoneResponse =
        await emergencyOpsService.createSafeZone(request);

      const newZone: SafeZone = {
        id: response.id,
        name: formData.name,
        type: formData.type as SafeZone["type"],
        address: formData.address,
        longitude,
        latitude,
        radius: parseFloat(formData.radius),
        createdAt: new Date(response.createdAtMs).toISOString(),
      };

      setZones((prev) => [newZone, ...prev]);
      closeCreateModal();
      setFormData({
        name: "",
        type: "Police Station",
        address: "",
        radius: "500",
      });
      toast.success(t("toastCreated"));
    } catch (error) {
      toast.error(t("toastCreateError"));
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await emergencyOpsService.deleteSafeZone(confirmDelete.id);
      setZones((prev) => prev.filter((z) => z.id !== confirmDelete.id));
      setConfirmDelete(null);
      toast.success(t("toastDeleted"));
    } catch (error) {
      toast.error(t("toastDeleteError"));
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: t("pageTitle") }]} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-xl font-semibold">
          {t("pageTitle")}
        </h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("addZone")}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
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
                <th className="px-6 py-3 text-left text-gray-700">
                  {t("tableName")}
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  {t("tableCoordinates")}
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  {t("tableRadius")}
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  {t("tableCreated")}
                </th>
                <th className="px-6 py-3 text-left text-gray-700">
                  {tCommon("actions")}
                </th>
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
                      title={tCommon("delete")}
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
              ? t("mapSelectedTitle", { name: selectedZone.name })
              : t("mapAllTitle")}
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
              {t("showAll")}
            </button>
          </div>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-gray-900">{t("modalTitle")}</h3>
            </div>
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="h-90 lg:h-full min-h-90 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
                <MapView
                  center={selectedLocation ?? DEFAULT_CENTER}
                  markers={
                    selectedLocation
                      ? [
                          {
                            position: selectedLocation,
                            label: t("pageTitle"),
                          },
                        ]
                      : []
                  }
                  onMapClick={(position) => setSelectedLocation(position)}
                />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    {t("formName")}
                    {tCommon("requiredSuffix")}
                  </label>
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
                  <label className="block text-gray-700 mb-2">
                    {t("formType")}
                    {tCommon("requiredSuffix")}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                    required
                  >
                    <option value="Police Station">{t("typePolice")}</option>
                    <option value="Hospital">{t("typeHospital")}</option>
                    <option value="Shelter">{t("typeShelter")}</option>
                    <option value="Other">{t("typeOther")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    {t("formAddress")}
                  </label>
                  <input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    {t("formRadius")}
                    {tCommon("requiredSuffix")}
                  </label>
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
                <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-4 text-sm text-gray-700">
                  <p className="font-medium text-gray-900 mb-1">
                    {t("formLatitude")} / {t("formLongitude")}
                  </p>
                  <p>
                    {selectedLocation
                      ? `${selectedLocation[0].toFixed(6)}, ${selectedLocation[1].toFixed(6)}`
                      : "Click on the map to choose the safe-zone center."}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeCreateModal}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  !formData.name || !selectedLocation || !formData.radius
                }
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {tCommon("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title={t("deleteTitle")}
          message={t("deleteMessage", { name: confirmDelete.name })}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          confirmText={tCommon("delete")}
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
