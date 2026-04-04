"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Guideline } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
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

export default function GuidelinesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [guidelines, setGuidelines] = useState<Guideline[]>(mockGuidelines);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!user) return null;

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard/guidelines/create");
  };

  const handleView = (guideline: Guideline) => {
    router.push(`/dashboard/guidelines/${guideline.id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await mockRequest(false);
      setGuidelines(guidelines.filter((g) => g.id !== id));
      setConfirmDelete(null);
      toast.success("Xóa thành công");
    } catch (error) {
      toast.error("Lỗi khi xóa tài liệu hướng dẫn");
      console.error(error);
    }
  };

  const filteredGuidelines = guidelines.filter((guideline) => {
    const matchesSearch =
      guideline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guideline.abstractText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // List mode - showing all guidelines
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-gray-900 text-xl font-semibold">
          System Guidelines
        </h2>
        {user.role === "Reporter" && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Guideline
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid gap-4">
        {filteredGuidelines.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No guidelines found.</p>
          </div>
        ) : (
          filteredGuidelines.map((guideline) => (
            <div
              key={guideline.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-gray-900 font-medium">
                      {guideline.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">{guideline.abstractText}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {new Date(guideline.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleView(guideline)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Guideline"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {user.role === "Reporter" && (
                    <button
                      onClick={() => setConfirmDelete(guideline.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Guideline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
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
