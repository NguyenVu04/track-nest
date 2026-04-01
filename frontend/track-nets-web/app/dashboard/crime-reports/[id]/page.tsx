"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { CrimeReport } from "@/types";
import { CrimeReportDetail } from "@/components/crime-reports/CrimeReportDetail";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";

// Mock data
const mockCrimeReports: CrimeReport[] = [
  {
    id: "1",
    title: "Theft - Vehicle Break-in",
    content: "Car window smashed, items stolen from vehicle",
    severity: 3,
    date: "2026-01-03T22:30:00Z",
    longitude: -73.9776,
    latitude: 40.7614,
    numberOfVictims: 1,
    numberOfOffenders: 1,
    arrested: false,
    createdAt: "2026-01-04T08:00:00Z",
    updatedAt: "2026-01-04T08:00:00Z",
    reporterId: "user-1",
    isPublic: true,
  },
  {
    id: "2",
    title: "Assault - Street Altercation",
    content: "Physical altercation between two individuals",
    severity: 5,
    date: "2026-01-02T19:15:00Z",
    longitude: -73.9855,
    latitude: 40.758,
    numberOfVictims: 1,
    numberOfOffenders: 1,
    arrested: false,
    createdAt: "2026-01-02T19:30:00Z",
    updatedAt: "2026-01-02T19:30:00Z",
    reporterId: "user-2",
    isPublic: true,
  },
  {
    id: "3",
    title: "Burglary - Residential",
    content: "Break-in at residential apartment, valuables stolen",
    severity: 4,
    date: "2026-01-01T03:00:00Z",
    longitude: -73.9566,
    latitude: 40.7736,
    numberOfVictims: 1,
    numberOfOffenders: 2,
    arrested: false,
    createdAt: "2026-01-01T09:00:00Z",
    updatedAt: "2026-01-01T09:00:00Z",
    reporterId: "user-3",
    isPublic: true,
  },
  {
    id: "4",
    title: "Vandalism - Public Property",
    content: "Graffiti on public building",
    severity: 1,
    date: "2026-01-03T02:00:00Z",
    longitude: -74.006,
    latitude: 40.7128,
    numberOfVictims: 0,
    numberOfOffenders: 1,
    arrested: false,
    createdAt: "2026-01-03T08:00:00Z",
    updatedAt: "2026-01-03T08:00:00Z",
    reporterId: "user-4",
    isPublic: true,
  },
];

export default function CrimeReportDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [crimeReports, setCrimeReports] =
    useState<CrimeReport[]>(mockCrimeReports);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const selectedReport = crimeReports.find((r) => r.id === id);

  if (!user) return null;

  if (isLoading) {
    return <Loading />;
  }

  if (!selectedReport) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Crime Report Not Found</h2>
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

  const handleEdit = (report: CrimeReport) => {
    router.push(`/dashboard/crime-reports/${report.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    try {
      await mockRequest(false);
      setCrimeReports(crimeReports.filter((r) => r.id !== id));
      toast.success("Thành công");
      router.push("/dashboard/crime-reports");
    } catch (error) {
      toast.error("Lỗi khi xóa báo cáo tội phạm");
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <CrimeReportDetail
      report={selectedReport}
      onBack={handleBack}
      onEdit={handleEdit}
      onDelete={handleDelete}
      userRole={user.role}
    />
  );
}
