"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Search,
  MapPin,
  Home,
  School,
  Shield,
  Filter,
  Navigation,
  Settings2,
  Loader2,
  X,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import {
  searchLocations,
  reverseGeocode,
  GeocodingResult,
} from "@/utils/geocoding";
import { useAuth } from "@/contexts/AuthContext";
import type { SafeZone } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { MapView } from "@/components/shared/MapView";
import { toast } from "sonner";
import {
  emergencyOpsService,
  CreateSafeZoneRequest,
  CreateSafeZoneResponse,
  PageResponse,
  SafeZoneResponse,
} from "@/services/emergencyOpsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations, useFormatter } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const DEFAULT_CENTER: [number, number] = [10.8231, 106.6297];

export default function SafeZonesPage() {
  const { user } = useAuth();
  const t = useTranslations("safeZones");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [zones, setZones] = useState<SafeZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SafeZone | null>(null);
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<GeocodingResult[]>([]);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [debouncedLocationInput] = useDebounce(locationInput, 300);
  const locationSearchRef = useRef<HTMLDivElement>(null);
  const skipReverseRef = useRef(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Police Station",
    address: "",
    radius: "500",
  });

  useEffect(() => {
    const fetchZones = async () => {
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
        toast.error(t("toastLoadError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, [user, t]);

  // Hide location suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        locationSearchRef.current &&
        !locationSearchRef.current.contains(e.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Forward geocoding for location search
  useEffect(() => {
    if (debouncedLocationInput.trim().length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    let cancelled = false;
    setIsLocationSearching(true);
    searchLocations(debouncedLocationInput).then((results) => {
      if (cancelled) return;
      setLocationSuggestions(results);
      setShowLocationSuggestions(results.length > 0);
      setIsLocationSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedLocationInput]);

  // Reverse geocode when selectedLocation changes via map click or drag
  useEffect(() => {
    if (!selectedLocation) return;
    if (skipReverseRef.current) {
      skipReverseRef.current = false;
      return;
    }
    let cancelled = false;
    reverseGeocode(selectedLocation[0], selectedLocation[1]).then((label) => {
      if (cancelled || label === null) return;
      setLocationInput(label);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedLocation]);

  const handleLocationSuggestionSelect = useCallback((result: GeocodingResult) => {
    skipReverseRef.current = true;
    setLocationInput(result.label);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    setSelectedLocation([result.lat, result.lng]);
  }, []);

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getZoneIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('home')) return Home;
    if (lower.includes('school') || lower.includes('college')) return School;
    return Shield;
  };

  const openCreateModal = () => {
    setSelectedLocation(DEFAULT_CENTER);
    setLocationInput("");
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    skipReverseRef.current = true;
    setFormData({
      name: "",
      type: "Police Station",
      address: "",
      radius: "500",
    });
    setIsCreating(true);
  };

  const handleCreate = async () => {
    try {
      if (!selectedLocation) {
        toast.error(t("toastNoLocation"));
        return;
      }
      const [latitude, longitude] = selectedLocation;
      const request: CreateSafeZoneRequest = {
        name: formData.name,
        longitudeDegrees: longitude,
        latitudeDegrees: latitude,
        radiusMeters: parseFloat(formData.radius),
      };
      const response: CreateSafeZoneResponse = await emergencyOpsService.createSafeZone(request);
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
      setIsCreating(false);
      toast.success(t("toastCreated"));
    } catch (error) {
      toast.error(t("toastCreateError"));
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
    }
  };

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  return (
    <div className="space-y-8 pb-12">
      <Breadcrumbs items={[{ label: t("pageHeading") }]} />
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{t("pageHeading")}</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            {t("pageSubtitle")}
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="rounded-2xl h-14 px-8 bg-brand-700 text-white hover:bg-brand-800 font-black shadow-xl shadow-brand-700/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5 mr-3" />
          {t("createZone")}
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Map & Overview */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 overflow-hidden relative">
            <div className="h-[600px] w-full">
              <MapView
                center={selectedZone ? [selectedZone.latitude, selectedZone.longitude] : DEFAULT_CENTER}
                markers={zones.map(z => ({
                  position: [z.latitude, z.longitude],
                  label: z.name
                }))}
              />
            </div>
            
            {/* Active Zones Badge */}
            <div className="absolute top-8 left-8">
              <Badge className="bg-white text-brand-700 border-none rounded-xl px-4 py-2.5 font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-2xl">
                <div className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                {t("activeZones", { count: zones.length })}
              </Badge>
            </div>

            {/* Custom Zoom Controls Placeholder */}
            <div className="absolute top-8 right-8 flex flex-col gap-1 bg-white rounded-xl shadow-2xl p-1">
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-lg hover:bg-gray-50">
                <Plus className="w-5 h-5 text-gray-400" />
              </Button>
              <div className="h-px bg-gray-50 mx-2" />
              <Button variant="ghost" className="h-10 w-10 p-0 rounded-lg hover:bg-gray-50">
                <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: List of Zones */}
        <div className="lg:col-span-7">
          <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 min-h-[600px]">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t("configuredZones")}</h2>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-gray-50">
                    <Filter className="w-5 h-5 text-gray-400" />
                  </Button>
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-gray-50">
                    <Settings2 className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>
              </div>

              {/* Search bar inside list card */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder={t("searchByName")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-base font-bold"
                />
              </div>

              <div className="space-y-6">
                {filteredZones.map((zone) => {
                  const Icon = getZoneIcon(zone.name);
                  return (
                    <div 
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className={cn(
                        "group p-6 rounded-3xl border border-gray-50 transition-all cursor-pointer flex items-center gap-6 hover:shadow-xl hover:shadow-gray-200/50",
                        selectedZone?.id === zone.id ? "bg-brand-50/50 border-brand-100" : "bg-white"
                      )}
                    >
                      <div className="h-16 w-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 transition-transform group-hover:scale-110">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-lg font-black text-gray-900 tracking-tight truncate">{zone.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={tCommon("delete")}
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(zone); }}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 font-bold mb-4">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs truncate">{zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase">
                            {t("badgeRadius", { radius: zone.radius })}
                          </Badge>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-none rounded-lg px-3 py-1 font-black text-[10px] uppercase">
                            {t("badgeCreated", { date: format.dateTime(new Date(zone.createdAt), { month: "short", day: "numeric" }) })}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Modal - Redesigned */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <Card className="max-w-5xl w-full rounded-[3rem] border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col lg:flex-row h-[600px]">
              <div className="lg:w-3/5 h-full relative">
                <MapView
                  center={selectedLocation ?? DEFAULT_CENTER}
                  markers={selectedLocation ? [{ position: selectedLocation, label: "New Zone Center" }] : []}
                  onMapClick={(pos) => setSelectedLocation(pos)}
                  onMarkerDragEnd={(pos) => setSelectedLocation(pos)}
                />
                <div className="absolute top-6 left-6 z-10">
                  <Badge className="bg-white/90 backdrop-blur-md text-brand-700 px-4 py-2 rounded-xl font-bold border-none shadow-lg">
                    {t("mapPinHint")}
                  </Badge>
                </div>
              </div>
              <div className="lg:w-2/5 p-10 flex flex-col bg-white">
                <h3 className="text-2xl font-black text-gray-900 mb-6">{t("modalTitle")}</h3>

                {/* Location search — outside scrollable area so dropdown isn't clipped */}
                <div ref={locationSearchRef} className="relative mb-6">
                  <div className="relative flex items-center">
                    {isLocationSearching ? (
                      <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
                      placeholder={t("locationSearchPlaceholder")}
                      className="w-full h-12 pl-10 pr-10 rounded-xl bg-gray-50 border-none text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {locationInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocationInput("");
                          setLocationSuggestions([]);
                          setShowLocationSuggestions(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <ul className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] max-h-52 overflow-y-auto">
                      {locationSuggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleLocationSuggestionSelect(s);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 truncate"
                          >
                            {s.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("formZoneName")}</label>
                    <Input
                      placeholder={t("formZoneNamePlaceholder")}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-12 px-5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("formZoneRadius")}</label>
                    <Input 
                      type="number"
                      placeholder="500"
                      value={formData.radius}
                      onChange={(e) => setFormData({...formData, radius: e.target.value})}
                      className="h-12 px-5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-500 font-bold"
                    />
                  </div>
                  <div className="p-5 bg-brand-50 rounded-2xl border border-brand-100 mt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white rounded-lg">
                        <Navigation className="w-4 h-4 text-brand-600" />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("pinCoordinates")}</p>
                    </div>
                    <p className="text-sm font-black text-gray-900">
                      {selectedLocation ? `${selectedLocation[0].toFixed(6)}, ${selectedLocation[1].toFixed(6)}` : t("notSelectedYet")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pt-8 mt-auto border-t border-gray-50">
                  <Button variant="ghost" onClick={() => setIsCreating(false)} className="flex-1 h-12 rounded-xl font-bold">{tCommon("cancel")}</Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.name || !selectedLocation || !formData.radius}
                    className="flex-1 h-12 rounded-xl bg-brand-700 text-white font-black"
                  >
                    {tCommon("confirm")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
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
