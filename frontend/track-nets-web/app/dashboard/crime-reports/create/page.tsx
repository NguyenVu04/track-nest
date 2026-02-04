"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { CrimeReport } from "@/types";
import { CrimeReportForm } from "@/components/CrimeReportForm";
import { toast } from "sonner";

// Mock data
const mockCrimeReports: CrimeReport[] = [
  {
    id: "1",
    title: "Theft - Vehicle Break-in",
    type: "Theft",
    description: "Car window smashed, items stolen from vehicle",
    location: "Parking Garage, 5th Avenue",
    incidentDate: "2026-01-03T22:30:00Z",
    coordinates: [40.7614, -73.9776],
    zoneType: "circle",
    zoneRadius: 300,
    reportedBy: "NYPD Officer J. Smith",
    reportedDate: "2026-01-04T08:00:00Z",
    severity: "Medium",
    status: "Under Investigation",
  },
  {
    id: "2",
    title: "Assault - Street Altercation",
    type: "Assault",
    description: "Physical altercation between two individuals",
    location: "Broadway & 42nd Street",
    incidentDate: "2026-01-02T19:15:00Z",
    coordinates: [40.758, -73.9855],
    zoneType: "rectangle",
    zoneBounds: [
      [40.757, -73.9865],
      [40.759, -73.9845],
    ],
    reportedBy: "Witness Report",
    reportedDate: "2026-01-02T19:30:00Z",
    severity: "High",
    status: "Active",
  },
  {
    id: "3",
    title: "Burglary - Residential",
    type: "Burglary",
    description: "Break-in at residential apartment, valuables stolen",
    location: "Upper East Side Apartment Complex",
    incidentDate: "2026-01-01T03:00:00Z",
    coordinates: [40.7736, -73.9566],
    zoneType: "circle",
    zoneRadius: 250,
    reportedBy: "NYPD Officer M. Johnson",
    reportedDate: "2026-01-01T09:00:00Z",
    severity: "High",
    status: "Resolved",
  },
  {
    id: "4",
    title: "Vandalism - Public Property",
    type: "Vandalism",
    description: "Graffiti on public building",
    location: "City Hall Area",
    incidentDate: "2026-01-03T02:00:00Z",
    coordinates: [40.7128, -74.006],
    zoneType: "rectangle",
    zoneBounds: [
      [40.7118, -74.007],
      [40.7138, -74.005],
    ],
    reportedBy: "City Services",
    reportedDate: "2026-01-03T08:00:00Z",
    severity: "Low",
    status: "Active",
  },
];

export default function CreateCrimeReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [crimeReports, setCrimeReports] =
    useState<CrimeReport[]>(mockCrimeReports);

  if (!user || user.role !== "Reporter") {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Unauthorized</h2>
        <p className="text-gray-600 mb-4">
          You do not have permission to create crime reports.
        </p>
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const handleSave = async (report: CrimeReport) => {
    try {
      await mockRequest(false);
      setCrimeReports([...crimeReports, report]);
      toast.success("Report created successfully");
      router.push("/dashboard/crime-reports");
    } catch (error) {
      toast.error("Lỗi khi tạo báo cáo mới");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <CrimeReportForm
      report={null}
      onSave={handleSave}
      onCancel={handleCancel}
      mode="create"
    />
  );
}
