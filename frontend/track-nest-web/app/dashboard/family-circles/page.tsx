"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Trash2, Eye, LogIn, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import {
  userTrackingService,
  FamilyCircle,
} from "@/services/userTrackingService";

export default function FamilyCirclesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [circles, setCircles] = useState<FamilyCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchCircles = async () => {
      try {
        setIsLoading(true);
        const response = await userTrackingService.familyCircle.list(0, 50);
        setCircles(response.items ?? []);
      } catch (error) {
        console.error("Failed to fetch family circles:", error);
        toast.error("Failed to load family circles");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCircles();
  }, [user]);

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  const handleCreate = async () => {
    if (!newCircleName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await userTrackingService.familyCircle.create({ name: newCircleName.trim() });
      setCircles((prev) => [created, ...prev]);
      setNewCircleName("");
      setShowCreateModal(false);
      toast.success("Family circle created");
    } catch (error) {
      toast.error("Failed to create family circle");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return;
    setIsSubmitting(true);
    try {
      const joined = await userTrackingService.familyCircle.joinWithCode(joinCode.trim());
      setCircles((prev) => [...prev, joined]);
      setJoinCode("");
      setShowJoinModal(false);
      toast.success("Joined family circle successfully");
    } catch (error) {
      toast.error("Failed to join family circle");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (circleId: string) => {
    try {
      await userTrackingService.familyCircle.delete(circleId);
      setCircles((prev) => prev.filter((c) => c.id !== circleId));
      setConfirmDelete(null);
      toast.success("Family circle deleted");
    } catch (error) {
      toast.error("Failed to delete family circle");
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-gray-900 text-xl font-semibold">Family Circles</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Join with Code
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Circle
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {circles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No family circles found. Create one or join with an invite code.</p>
          </div>
        ) : (
          circles.map((circle) => (
            <div
              key={circle.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-gray-900 font-medium">{circle.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    Created {new Date(circle.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => router.push(`/dashboard/family-circles/${circle.id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Circle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(circle.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Circle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Family Circle</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Circle Name *</label>
              <input
                type="text"
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                placeholder="e.g. My Family"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setShowCreateModal(false); setNewCircleName(""); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting || !newCircleName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join with Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Join with Invite Code</h3>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Invite Code *</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinWithCode()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                placeholder="Enter invite code"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setShowJoinModal(false); setJoinCode(""); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinWithCode}
                disabled={isSubmitting || !joinCode.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Joining…" : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete Family Circle"
          message="Are you sure you want to delete this family circle? All members will be removed. This action cannot be undone."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Delete"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
