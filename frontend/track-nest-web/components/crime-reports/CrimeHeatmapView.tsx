"use client";

import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import dynamic from "next/dynamic";
import type { CrimeReport } from "@/types";
import { MapView } from "../shared/MapView";
import { toast } from "sonner";
import { criminalReportsService } from "@/services/criminalReportsService";
import { LoadingCard } from "../loading/LoadingCard";

const HeatmapCenterPicker = dynamic(
  () =>
    import("../shared/HeatmapCenterPicker").then((mod) => ({
      default: mod.HeatmapCenterPicker,
    })),
  { ssr: false, loading: () => <LoadingCard /> },
);

interface CrimeHeatmapViewProps {
  onBack: () => void;
}

export function CrimeHeatmapView({ onBack }: CrimeHeatmapViewProps) {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [heatmapReports, setHeatmapReports] = useState<CrimeReport[]>([]);

  const [centerPosition, setCenterPosition] = useState<[number, number]>([10.7769, 106.7009]);
  const [radiusInput, setRadiusInput] = useState("5000");

  const handleGenerate = async () => {
    const [latitude, longitude] = centerPosition;
    const radius = parseFloat(radiusInput);

    if (!Number.isFinite(radius) || radius <= 0) {
      toast.error("Please enter a valid radius value.");
      return;
    }

    try {
      setIsGenerating(true);
      const response = await criminalReportsService.viewCrimeHeatmap(
        longitude,
        latitude,
        radius,
        0,
        100,
      );

      const mapped: CrimeReport[] = response.content.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        contentDocId: item.contentDocId,
        severity: item.severity as CrimeReport["severity"],
        date: item.date,
        longitude: item.longitude,
        latitude: item.latitude,
        numberOfVictims: item.numberOfVictims,
        numberOfOffenders: item.numberOfOffenders,
        arrested: item.arrested,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        reporterId: item.reporterId,
        isPublic: item.isPublic,
      }));

      setHeatmapReports(mapped);
      setHasGenerated(true);
      toast.success(`Loaded ${mapped.length} crime reports in the area.`);
    } catch (error) {
      toast.error("Failed to load crime heatmap data.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHeatmapData = (): [number, number, number][] =>
    heatmapReports.map((report) => [
      report.latitude,
      report.longitude,
      report.severity * 2,
    ]);

  const heatmapData = hasGenerated ? generateHeatmapData() : [];

  const markers = heatmapReports.map((report) => ({
    position: [report.latitude, report.longitude] as [number, number],
    label: report.title,
    popup: `${report.title}<br/>Severity: ${report.severity}/5`,
  }));

  const center: [number, number] =
    heatmapReports.length > 0
      ? [
          heatmapReports.reduce((sum, r) => sum + r.latitude, 0) / heatmapReports.length,
          heatmapReports.reduce((sum, r) => sum + r.longitude, 0) / heatmapReports.length,
        ]
      : centerPosition;

  const handleDownload = () => {
    if (!hasGenerated) return;
    const csvContent = [
      ["Title", "Severity", "Date", "Latitude", "Longitude"],
      ...heatmapReports.map((r) => [
        r.title,
        r.severity.toString(),
        new Date(r.date).toLocaleDateString(),
        r.latitude.toString(),
        r.longitude.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crime-heatmap-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: heatmapReports.length,
    high: heatmapReports.filter((r) => r.severity >= 4).length,
    medium: heatmapReports.filter((r) => r.severity === 3).length,
    low: heatmapReports.filter((r) => r.severity <= 2).length,
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-gray-900">Crime Heat Analysis</h2>
      </div>

      {/* Filters and Generate */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Center Location
            <span className="ml-2 text-sm font-normal text-gray-400">
              (click on the map to select)
            </span>
          </label>
          <HeatmapCenterPicker
            position={centerPosition}
            radius={parseFloat(radiusInput) || 0}
            onPositionChange={setCenterPosition}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Radius (meters)</label>
            <input
              type="number"
              step="any"
              min="1"
              value={radiusInput}
              onChange={(e) => setRadiusInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
              placeholder="e.g. 5000"
            />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {isGenerating ? "Generating..." : "Generate Heatmap"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!hasGenerated}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {!hasGenerated && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center">
          <p className="text-gray-600">
            Enter a center coordinate and radius, then click &quot;Generate Heatmap&quot;
            to load public crime data from the server.
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      {hasGenerated && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">Total Reports</p>
            <p className="text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">High Severity</p>
            <p className="text-red-600 mt-1">{stats.high}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">Medium Severity</p>
            <p className="text-yellow-600 mt-1">{stats.medium}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">Low Severity</p>
            <p className="text-green-600 mt-1">{stats.low}</p>
          </div>
        </div>
      )}

      {/* Heatmap */}
      {hasGenerated && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Crime Density Heatmap</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded opacity-60"></div>
                <span className="text-gray-600">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded opacity-30"></div>
                <span className="text-gray-600">Low</span>
              </div>
            </div>
          </div>
          <MapView
            center={center}
            markers={markers}
            heatmapData={heatmapData}
            height="600px"
          />
          <p className="text-gray-600 text-sm mt-4">
            Red circles represent crime hotspots. Darker and larger circles
            indicate higher crime density.
          </p>
        </div>
      )}
    </div>
  );
}
