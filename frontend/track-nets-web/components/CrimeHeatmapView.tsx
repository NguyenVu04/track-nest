"use client";

import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import type { CrimeReport } from "@/types";
import { MapView } from "./MapView";

interface CrimeHeatmapViewProps {
  reports: CrimeReport[];
  onBack: () => void;
}

export function CrimeHeatmapView({ reports, onBack }: CrimeHeatmapViewProps) {
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Generate heatmap data from reports
  const generateHeatmapData = (): [number, number, number][] => {
    let filteredReports = reports;

    // Filter by type
    if (selectedType !== "all") {
      filteredReports = filteredReports.filter((r) => r.type === selectedType);
    }

    // Convert reports to heatmap data points
    return filteredReports.map((report) => {
      // Intensity based on severity
      const intensity =
        report.severity === "High" ? 10 : report.severity === "Medium" ? 6 : 3;
      return [report.coordinates[0], report.coordinates[1], intensity];
    });
  };

  const heatmapData = generateHeatmapData();

  // Get all markers from reports
  const markers = reports.map((report) => ({
    position: report.coordinates as [number, number],
    label: report.title,
    popup: `${report.title}<br/>Type: ${report.type}<br/>Severity: ${report.severity}`,
  }));

  // Calculate center from all reports
  const center: [number, number] =
    reports.length > 0
      ? [
          reports.reduce((sum, r) => sum + r.coordinates[0], 0) /
            reports.length,
          reports.reduce((sum, r) => sum + r.coordinates[1], 0) /
            reports.length,
        ]
      : [40.7829, -73.9654];

  const handleDownload = () => {
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
      ...reports.map((r) => [
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
    total: reports.length,
    high: reports.filter((r) => r.severity === "High").length,
    medium: reports.filter((r) => r.severity === "Medium").length,
    low: reports.filter((r) => r.severity === "Low").length,
    active: reports.filter((r) => r.status === "Active").length,
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

      {/* Statistics Cards */}
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

      {/* Filters and Download */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label htmlFor="typeFilter" className="block text-gray-700 mb-2">
              Filter by Crime Type
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
          <div className="flex items-end">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap */}
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
    </div>
  );
}
