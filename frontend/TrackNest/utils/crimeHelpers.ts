import { minioService } from "@/services/mediaUpload";
import { criminalReportsService } from "@/services/criminalReports";
import type { CrimeReport, CreateCrimeReportInput } from "@/types/criminalReports";

export function getSeverityLabel(severity: number): string {
  if (severity >= 4) return "High";
  if (severity >= 2) return "Medium";
  return "Low";
}

export function getSeverityColor(severity: number): string {
  if (severity >= 4) return "#e74c3c";
  if (severity >= 2) return "#f39c12";
  return "#27ae60";
}

export function severityToNumber(severity: "Low" | "Medium" | "High"): number {
  switch (severity) {
    case "High":
      return 5;
    case "Medium":
      return 3;
    case "Low":
      return 1;
    default:
      return 3;
  }
}

export async function createCrimeReport(data: {
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  latitude: number;
  longitude: number;
  images: string[];
}): Promise<CrimeReport> {
  const uploadedUrls: string[] = [];

  if (data.images && data.images.length > 0) {
    for (const imageUri of data.images) {
      try {
        const filename = `crime_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const result = await minioService.uploadFile({
          uri: imageUri,
          filename,
          type: "image/jpeg",
        });
        uploadedUrls.push(result.url);
      } catch (error) {
        console.warn("Failed to upload image:", error);
      }
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const reportData: CreateCrimeReportInput = {
    title: data.title,
    content: data.description,
    severity: severityToNumber(data.severity),
    date: today,
    latitude: data.latitude,
    longitude: data.longitude,
    numberOfVictims: 1,
    numberOfOffenders: 1,
    arrested: false,
    photos: uploadedUrls.length > 0 ? uploadedUrls : undefined,
  };

  return criminalReportsService.createCrimeReport(reportData);
}
