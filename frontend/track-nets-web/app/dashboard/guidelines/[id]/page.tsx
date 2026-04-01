"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Guideline } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";

// Mock data
const mockGuidelines: Guideline[] = [
  {
    id: "1",
    title: "Missing Person Report Guidelines",
    abstractText:
      "Step-by-step guide for filing and managing missing person reports",
    createdAt: "2025-12-15T10:00:00Z",
    reporterId: "admin-1",
    isPublic: true,
    content: `# Missing Person Report Guidelines

## Overview
This document provides comprehensive guidelines for handling missing person reports in the TRACK system.

## Steps to File a Report
1. Gather all necessary information about the missing person
2. Fill out the complete report form with accurate details
3. Include last known location and coordinates
4. Provide contact information for follow-ups
5. Submit the report for review

## Best Practices
- Act quickly - the first 24 hours are crucial
- Provide clear physical descriptions
- Include recent photographs if available
- Keep contact information up to date
- Follow up regularly on report status

## Reporter Responsibilities
- Verify all information before publishing
- Maintain confidentiality of sensitive data
- Respond promptly to Emergency Services inquiries
- Update reports as new information becomes available`,
  },
  {
    id: "2",
    title: "Crime Reporting Procedures",
    abstractText: "Protocols for documenting and reporting criminal incidents",
    createdAt: "2025-12-20T14:30:00Z",
    reporterId: "admin-1",
    isPublic: true,
    content: `# Crime Reporting Procedures

## Purpose
To establish standardized procedures for documenting and reporting criminal incidents in the TRACK system.

## Incident Documentation
1. Record the date, time, and location of the incident
2. Classify the crime type accurately
3. Assess and assign severity level
4. Define the crime zone (circular or rectangular)
5. Provide detailed incident description

## Zone Mapping
- Use circular zones for point-source incidents
- Use rectangular zones for area-wide incidents
- Ensure accurate coordinate input
- Verify zone coverage matches incident scope

## Publishing Reports
- Review all details before publishing
- Ensure proper severity classification
- Coordinate with Emergency Services when needed
- Monitor report status regularly`,
  },
  {
    id: "3",
    title: "System Access and Security",
    abstractText: "User authentication and security best practices",
    createdAt: "2026-01-01T09:00:00Z",
    reporterId: "admin-1",
    isPublic: true,
    content: `# System Access and Security

## Account Security
- Use strong, unique passwords
- Change passwords regularly (every 90 days)
- Never share login credentials
- Log out when not in use
- Report suspicious activity immediately

## Role-Based Access
### Reporter Role
- Create and manage reports
- Publish missing person reports
- Delete invalid reports
- Access all dashboard features

### Emergency Services Role
- View all published reports
- Generate crime analysis reports
- Download heatmap data
- Access real-time updates

## Data Privacy
- Handle all personal information with care
- Follow GDPR and local privacy regulations
- Do not collect unnecessary personal data
- Ensure secure data transmission
- Maintain data confidentiality`,
  },
];

export default function GuidelineDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [guidelines, setGuidelines] = useState<Guideline[]>(mockGuidelines);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const selectedGuideline = guidelines.find((g) => g.id === id);

  if (!user) return null;

  if (isLoading) {
    return <Loading />;
  }

  if (!selectedGuideline) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Guideline Not Found</h2>
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

  const handleDelete = async (id: string) => {
    try {
      await mockRequest(false);
      setGuidelines(guidelines.filter((g) => g.id !== id));
      setConfirmDelete(null);
      toast.success("Xóa thành công");
      router.push("/dashboard/guidelines");
    } catch (error) {
      toast.error("Lỗi khi xóa tài liệu hướng dẫn");
      console.error(error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="max-w-4xl">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
      >
        ← Back to Guidelines
      </button>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-gray-900 mb-2 text-xl font-semibold">
              {selectedGuideline.title}
            </h2>
            <p className="text-gray-600">{selectedGuideline.abstractText}</p>
          </div>
          {user.role === "Reporter" && (
            <button
              onClick={() => setConfirmDelete(selectedGuideline.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Guideline"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
          <span>Created at {new Date(selectedGuideline.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-900">
            {selectedGuideline.content}
          </div>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title="Delete Guideline"
          message="Are you sure you want to delete this guideline? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
