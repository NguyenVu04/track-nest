"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Trash2,
  UserCheck,
  Shield,
  Users,
  AlertTriangle,
  Mail,
  Calendar,
  Activity,
  FileText,
  MapPin,
  Bell,
  Edit,
  Plus,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { User, UserActivity, UserRole } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Loading } from "@/components/loading/Loading";
import { toast } from "sonner";


export default function AccountDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "ban" | "unban" | "delete";
  } | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const selectedAccount = users.find((u) => u.id === id);
  const userActivities: UserActivity[] = [];

  // Only Admin can access this page
  if (
    !user
    // || user.role !== "Admin"
  ) {
    return (
      <div className="text-gray-900">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
        </div>
        <p className="text-gray-600 mb-4">
          You do not have permission to access this page.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Go to Dashboard
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!selectedAccount) {
    return (
      <div className="text-gray-900">
        <h2 className="text-xl font-semibold mb-4">Account Not Found</h2>
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const handleBan = async () => {
    try {
      setUsers(
        users.map((u) =>
          u.id === selectedAccount.id ? { ...u, status: "Banned" as const } : u,
        ),
      );
      toast.success(`Account "${selectedAccount.username}" has been banned`);
      setConfirmAction(null);
    } catch (error) {
      toast.error("Failed to ban account");
      console.error(error);
    }
  };

  const handleUnban = async () => {
    try {
      setUsers(
        users.map((u) =>
          u.id === selectedAccount.id ? { ...u, status: "Active" as const } : u,
        ),
      );
      toast.success(`Account "${selectedAccount.username}" has been unbanned`);
      setConfirmAction(null);
    } catch (error) {
      toast.error("Failed to unban account");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      toast.success(`Account "${selectedAccount.username}" has been deleted`);
      setConfirmAction(null);
      router.push("/dashboard/accounts");
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return <Shield className="w-5 h-5 text-purple-600" />;
      case "Reporter":
        return <Users className="w-5 h-5 text-blue-600" />;
      case "Emergency Service":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-700";
      case "Reporter":
        return "bg-blue-100 text-blue-700";
      case "Emergency Service":
        return "bg-orange-100 text-orange-700";
    }
  };

  const getStatusBadgeColor = (status: User["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Banned":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getActivityIcon = (activity: UserActivity) => {
    switch (activity.action) {
      case "create":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "edit":
        return <Edit className="w-4 h-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case "publish":
        return <CheckCircle className="w-4 h-4 text-indigo-600" />;
      case "ban":
        return <Ban className="w-4 h-4 text-orange-600" />;
      case "unban":
        return <UserCheck className="w-4 h-4 text-green-600" />;
    }
  };

  const getTargetIcon = (targetType: UserActivity["targetType"]) => {
    switch (targetType) {
      case "missing-person":
        return <Users className="w-4 h-4 text-gray-400" />;
      case "crime-report":
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
      case "guideline":
        return <FileText className="w-4 h-4 text-gray-400" />;
      case "emergency-request":
        return <Bell className="w-4 h-4 text-gray-400" />;
      case "account":
        return <Shield className="w-4 h-4 text-gray-400" />;
      case "safe-zone":
        return <MapPin className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredActivities = userActivities.filter((activity) => {
    if (activityFilter === "all") return true;
    return activity.targetType === activityFilter;
  });

  // Get the latest status from the users state
  const currentAccount = users.find((u) => u.id === id) || selectedAccount;

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </button>

      {/* Account Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-2xl">
                {currentAccount.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-gray-900 text-xl font-semibold">
                {currentAccount.fullName}
              </h2>
              <p className="text-gray-500">@{currentAccount.username}</p>
            </div>
          </div>
          {currentAccount.id !== user.id && (
            <div className="flex items-center gap-2">
              {currentAccount.status === "Banned" ? (
                <button
                  onClick={() => setConfirmAction({ type: "unban" })}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => setConfirmAction({ type: "ban" })}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Ban
                </button>
              )}
              <button
                onClick={() => setConfirmAction({ type: "delete" })}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-gray-500 text-sm">Email</p>
              <p className="text-gray-900">{currentAccount.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getRoleIcon(currentAccount.role[0])}
            <div>
              <p className="text-gray-500 text-sm">Role</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {currentAccount.role.map((r) => (
                  <span
                    key={r}
                    className={`inline-block px-3 py-1 rounded-full text-sm ${getRoleBadgeColor(r)}`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-gray-500 text-sm">Created At</p>
              <p className="text-gray-900">
                {currentAccount.createdAt
                  ? new Date(currentAccount.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )
                  : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusBadgeColor(
                  currentAccount.status,
                )}`}
              >
                {currentAccount.status || "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-gray-900 text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity History
          </h3>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
          >
            <option value="all">All Activities</option>
            <option value="missing-person">Missing Persons</option>
            <option value="crime-report">Crime Reports</option>
            <option value="guideline">Guidelines</option>
            <option value="emergency-request">Emergency Requests</option>
            <option value="safe-zone">Safe Zones</option>
            <option value="account">Account Actions</option>
          </select>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activity found for this account.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 capitalize">
                      {activity.action}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="flex items-center gap-1 text-gray-600">
                      {getTargetIcon(activity.targetType)}
                      <span className="capitalize">
                        {activity.targetType.replace("-", " ")}
                      </span>
                    </span>
                  </div>
                  <p className="text-gray-900">{activity.targetName}</p>
                  {activity.details && (
                    <p className="text-gray-500 text-sm mt-1">
                      {activity.details}
                    </p>
                  )}
                  <p className="text-gray-400 text-sm mt-2">
                    {new Date(activity.timestamp).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modals */}
      {confirmAction?.type === "ban" && (
        <ConfirmModal
          title="Ban Account"
          message={`Are you sure you want to ban the account "${currentAccount.username}"? This user will not be able to access the system.`}
          onConfirm={handleBan}
          onCancel={() => setConfirmAction(null)}
          confirmText="Ban Account"
          confirmStyle="danger"
        />
      )}

      {confirmAction?.type === "unban" && (
        <ConfirmModal
          title="Unban Account"
          message={`Are you sure you want to unban the account "${currentAccount.username}"? This user will regain access to the system.`}
          onConfirm={handleUnban}
          onCancel={() => setConfirmAction(null)}
          confirmText="Unban Account"
          confirmStyle="primary"
        />
      )}

      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title="Delete Account"
          message={`Are you sure you want to permanently delete the account "${currentAccount.username}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmAction(null)}
          confirmText="Delete Account"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
