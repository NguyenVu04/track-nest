import { useState } from "react";
import { Plus, Search, Upload, FileText, Trash2, Eye } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

export interface Guideline {
  id: string;
  title: string;
  description: string;
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  fileUrl?: string;
  content: string;
}

interface GuidelineDashboardProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

// Mock data
const mockGuidelines: Guideline[] = [
  {
    id: "1",
    title: "Missing Person Report Guidelines",
    description:
      "Step-by-step guide for filing and managing missing person reports",
    category: "Missing Persons",
    uploadedBy: "Admin",
    uploadedDate: "2025-12-15T10:00:00Z",
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
    description: "Protocols for documenting and reporting criminal incidents",
    category: "Crime Reports",
    uploadedBy: "Admin",
    uploadedDate: "2025-12-20T14:30:00Z",
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
    description: "User authentication and security best practices",
    category: "System Administration",
    uploadedBy: "Admin",
    uploadedDate: "2026-01-01T09:00:00Z",
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

export function GuidelineDashboard({ user }: GuidelineDashboardProps) {
  const [guidelines, setGuidelines] = useState<Guideline[]>(mockGuidelines);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedGuideline, setSelectedGuideline] = useState<Guideline | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Missing Persons",
    content: "",
  });

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedGuideline(null);
    setFormData({
      title: "",
      description: "",
      category: "Missing Persons",
      content: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newGuideline: Guideline = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      uploadedBy: user.fullName,
      uploadedDate: new Date().toISOString(),
      content: formData.content,
    };
    setGuidelines([newGuideline, ...guidelines]);
    setIsCreating(false);
    setFormData({
      title: "",
      description: "",
      category: "Missing Persons",
      content: "",
    });
  };

  const handleDelete = (id: string) => {
    setGuidelines(guidelines.filter((g) => g.id !== id));
    setConfirmDelete(null);
    if (selectedGuideline?.id === id) {
      setSelectedGuideline(null);
    }
  };

  const handleView = (guideline: Guideline) => {
    setSelectedGuideline(guideline);
    setIsCreating(false);
  };

  const handleBack = () => {
    setSelectedGuideline(null);
    setIsCreating(false);
  };

  const filteredGuidelines = guidelines.filter((guideline) => {
    const matchesSearch =
      guideline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guideline.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || guideline.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // View mode - showing a specific guideline
  if (selectedGuideline) {
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
              <h2 className="text-gray-900 mb-2">{selectedGuideline.title}</h2>
              <p className="text-gray-600">{selectedGuideline.description}</p>
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
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
              {selectedGuideline.category}
            </span>
            <span>Uploaded by {selectedGuideline.uploadedBy}</span>
            <span>
              {new Date(selectedGuideline.uploadedDate).toLocaleDateString()}
            </span>
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

  // Create mode - form to create a new guideline
  if (isCreating) {
    return (
      <div className="max-w-4xl">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          ← Back to Guidelines
        </button>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-6">Publish New Guideline</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-gray-700 mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-gray-700 mb-2">
                Description *
              </label>
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="Missing Persons">Missing Persons</option>
                <option value="Crime Reports">Crime Reports</option>
                <option value="System Administration">
                  System Administration
                </option>
                <option value="Emergency Procedures">
                  Emergency Procedures
                </option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label htmlFor="content" className="block text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={12}
                placeholder="Enter the guideline content. You can use Markdown formatting."
                required
              />
            </div>
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Publish Guideline
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List mode - showing all guidelines
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-gray-900">System Guidelines</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search guidelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Categories</option>
              <option value="Missing Persons">Missing Persons</option>
              <option value="Crime Reports">Crime Reports</option>
              <option value="System Administration">
                System Administration
              </option>
              <option value="Emergency Procedures">Emergency Procedures</option>
              <option value="General">General</option>
            </select>
          </div>
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
                    <h3 className="text-gray-900">{guideline.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{guideline.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      {guideline.category}
                    </span>
                    <span>By {guideline.uploadedBy}</span>
                    <span>
                      {new Date(guideline.uploadedDate).toLocaleDateString()}
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
