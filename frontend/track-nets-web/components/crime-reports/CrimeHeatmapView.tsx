"use client";

import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import type { CrimeReport } from "@/types";
import { MapView } from "../shared/MapView";
import { toast } from "sonner";

interface CrimeHeatmapViewProps {
  reports: CrimeReport[];
  onBack: () => void;
}

export function CrimeHeatmapView({ reports, onBack }: CrimeHeatmapViewProps) {
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const getArea = (report: CrimeReport) => {
    if (report.location.includes("Downtown")) return "Downtown";
    if (report.location.includes("Central")) return "Central";
    if (report.location.includes("Upper")) return "Uptown";
    return "Other";
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await mockRequest(false);
      setHasGenerated(true);
      toast.success("Thành công");
    } catch (error) {
      toast.error("Lỗi khi tổng hợp báo cáo tội phạm");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate heatmap data from reports
  const generateHeatmapData = (): [number, number, number][] => {
    // Convert reports to heatmap data points
    return reportsForView.map((report) => {
      // Intensity based on severity
      const intensity =
        report.severity === "High" ? 10 : report.severity === "Medium" ? 6 : 3;
      return [report.coordinates[0], report.coordinates[1], intensity];
    });
  };

  const filteredReports = reports.filter((report) => {
    const matchesArea =
      !selectedArea ||
      selectedArea === getArea(report) ||
      selectedArea === "all";
    const matchesType = selectedType === "all" || report.type === selectedType;
    const matchesFrom = fromDate
      ? new Date(report.incidentDate) >= new Date(fromDate)
      : true;
    const matchesTo = toDate
      ? new Date(report.incidentDate) <= new Date(toDate)
      : true;
    return matchesArea && matchesType && matchesFrom && matchesTo;
  });

  const reportsForView = hasGenerated ? filteredReports : [];

  const heatmapData = hasGenerated ? generateHeatmapData() : [];

  // Get all markers from reports
  const markers = reportsForView.map((report) => ({
    position: report.coordinates as [number, number],
    label: report.title,
    popup: `${report.title}<br/>Type: ${report.type}<br/>Severity: ${report.severity}`,
  }));

  // Calculate center from all reports
  const center: [number, number] =
    reportsForView.length > 0
      ? [
          reportsForView.reduce((sum, r) => sum + r.coordinates[0], 0) /
            reportsForView.length,
          reportsForView.reduce((sum, r) => sum + r.coordinates[1], 0) /
            reportsForView.length,
        ]
      : [40.7829, -73.9654];

  const handleDownload = () => {
    if (!hasGenerated) return;
    // Generate a simple CSV report
    const csvContent = [
      [
        "Title",
        "Type",
        "Severity",
        "Location",
        "Date",
        "Latitude",
        "Longitude",
      ],
      ...reportsForView.map((r) => [
        r.title,
        r.type,
        r.severity,
        r.location,
        new Date(r.incidentDate).toLocaleDateString(),
        r.coordinates[0].toString(),
        r.coordinates[1].toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crime-heatmap-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get statistics
  const stats = {
    total: reportsForView.length,
    high: reportsForView.filter((r) => r.severity === "High").length,
    medium: reportsForView.filter((r) => r.severity === "Medium").length,
    low: reportsForView.filter((r) => r.severity === "Low").length,
    active: reportsForView.filter((r) => r.status === "Active").length,
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="areaFilter" className="block text-gray-700 mb-2">
              Area *
            </label>
            <select
              id="areaFilter"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Area</option>
              <option value="Downtown">Downtown</option>
              <option value="Central">Central</option>
              <option value="Uptown">Uptown</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="fromDate" className="block text-gray-700 mb-2">
              From *
            </label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="toDate" className="block text-gray-700 mb-2">
              To *
            </label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="typeFilter" className="block text-gray-700 mb-2">
              Crime Type
            </label>
            <select
              id="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Theft">Theft</option>
              <option value="Assault">Assault</option>
              <option value="Burglary">Burglary</option>
              <option value="Vandalism">Vandalism</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
          <button
            onClick={handleGenerate}
            disabled={!selectedArea || !fromDate || !toDate || isGenerating}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {isGenerating ? "Generating..." : "Tạo báo cáo tổng hợp"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!hasGenerated}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      {!hasGenerated && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center">
          <p className="text-gray-600">
            Select area and time range, then click "Tạo báo cáo tổng hợp" to
            generate the analysis.
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      {hasGenerated && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600 text-sm">Active Cases</p>
            <p className="text-gray-900 mt-1">{stats.active}</p>
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
