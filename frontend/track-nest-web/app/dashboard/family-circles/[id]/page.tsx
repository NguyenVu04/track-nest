"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserMinus, Crown, Shield, User, Share2, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";
import {
  userTrackingService,
  FamilyCircle,
  FamilyCircleMember,
} from "@/services/userTrackingService";

export default function FamilyCircleDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [circle, setCircle] = useState<FamilyCircle | null>(null);
  const [members, setMembers] = useState<FamilyCircleMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    try {
      setIsLoading(true);
      const [circleData, membersData] = await Promise.all([
        userTrackingService.familyCircle.get(id),
        userTrackingService.familyCircle.listMembers(id, 0, 50),
      ]);
      setCircle(circleData);
      setNewName(circleData.name);
      setMembers(membersData.items ?? []);
    } catch (error) {
      console.error("Failed to fetch family circle:", error);
      toast.error("Failed to load family circle");
    } finally {
      setIsLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;
  if (isLoading) return <Loading />;

  if (!circle) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Family Circle Not Found</h2>
        <button onClick={() => router.back()} className="text-indigo-600 hover:text-indigo-700">
          ← Go Back
        </button>
      </div>
    );
  }

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === circle.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const updated = await userTrackingService.familyCircle.update(id, { name: newName.trim() });
      setCircle(updated);
      setIsEditingName(false);
      toast.success("Circle name updated");
    } catch (error) {
      toast.error("Failed to update circle name");
      console.error(error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await userTrackingService.familyCircle.removeMember(id, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setConfirmRemove(null);
      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
      console.error(error);
    }
  };

  const handleUpdateRole = async (memberId: string, role: "MEMBER" | "ADMIN") => {
    try {
      const updated = await userTrackingService.familyCircle.updateMemberRole(id, memberId, role);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      toast.success(`Role updated to ${role}`);
    } catch (error) {
      toast.error("Failed to update member role");
      console.error(error);
    }
  };

  const handleGenerateInvite = async () => {
    setIsGeneratingCode(true);
    try {
      const result = await userTrackingService.familyCircle.createPermission({ circleId: id });
      setInviteCode(result.code);
    } catch (error) {
      toast.error("Failed to generate invite code");
      console.error(error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success("Invite code copied to clipboard");
    }
  };

  const RoleIcon = ({ role }: { role: string }) => {
    if (role === "OWNER") return <Crown className="w-4 h-4 text-yellow-500" />;
    if (role === "ADMIN") return <Shield className="w-4 h-4 text-indigo-500" />;
    return <User className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
        ← Back to Family Circles
      </button>

      {/* Circle Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="text-xl font-semibold text-gray-900 border-b-2 border-indigo-500 focus:outline-none"
                  autoFocus
                />
                <button onClick={handleUpdateName} className="text-sm text-indigo-600 hover:text-indigo-700">Save</button>
                <button onClick={() => setIsEditingName(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            ) : (
              <h2
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                onClick={() => setIsEditingName(true)}
                title="Click to rename"
              >
                {circle.name}
              </h2>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Created {new Date(circle.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateInvite}
              disabled={isGeneratingCode}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
            >
              <Share2 className="w-4 h-4" />
              {isGeneratingCode ? "Generating…" : "Invite Code"}
            </button>
          </div>
        </div>

        {inviteCode && (
          <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <code className="flex-1 text-indigo-800 font-mono text-sm">{inviteCode}</code>
            <button
              onClick={handleCopyCode}
              className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Copy
            </button>
            <button
              onClick={() => setInviteCode(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-gray-900 font-semibold mb-4">
          Members ({members.length})
        </h3>

        {members.length === 0 ? (
          <p className="text-gray-500 text-sm">No members yet. Share an invite code to add people.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-700 text-sm font-medium">
                      {(member.firstName?.[0] ?? member.username?.[0] ?? "?").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium text-sm">
                        {member.firstName && member.lastName
                          ? `${member.firstName} ${member.lastName}`
                          : member.username}
                      </span>
                      <RoleIcon role={member.role} />
                      <span className="text-xs text-gray-400">{member.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {member.role !== "OWNER" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/family-circles/${id}/location/${member.userId}`)
                      }
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View Location"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                    {member.role === "MEMBER" ? (
                      <button
                        onClick={() => handleUpdateRole(member.id, "ADMIN")}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Promote to Admin"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateRole(member.id, "MEMBER")}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Demote to Member"
                      >
                        <User className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmRemove(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmRemove && (
        <ConfirmModal
          title="Remove Member"
          message="Are you sure you want to remove this member from the family circle?"
          onConfirm={() => handleRemoveMember(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
          confirmText="Remove"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
