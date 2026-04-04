"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Eye,
  Ban,
  Trash2,
  UserCheck,
  Shield,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { toast } from "sonner";

// Mock data for users
const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    email: "admin@tracknest.com",
    role: "Admin",
    fullName: "System Administrator",
    status: "Active",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "2",
    username: "reporter1",
    password: "password123",
    email: "reporter1@tracknest.com",
    role: "Reporter",
    fullName: "John Smith",
    status: "Active",
    createdAt: "2025-06-15T10:30:00Z",
  },
  {
    id: "3",
    username: "reporter2",
    password: "password123",
    email: "reporter2@tracknest.com",
    role: "Reporter",
    fullName: "Jane Doe",
    status: "Active",
    createdAt: "2025-07-20T14:45:00Z",
  },
  {
    id: "4",
    username: "emergency1",
    password: "password123",
    email: "emergency1@tracknest.com",
    role: "Emergency Services",
    fullName: "Officer Mike Johnson",
    status: "Active",
    createdAt: "2025-08-10T08:00:00Z",
  },
  {
    id: "5",
    username: "reporter3",
    password: "password123",
    email: "reporter3@tracknest.com",
    role: "Reporter",
    fullName: "Sarah Williams",
    status: "Banned",
    createdAt: "2025-09-05T16:20:00Z",
  },
  {
    id: "6",
    username: "emergency2",
    password: "password123",
    email: "emergency2@tracknest.com",
    role: "Emergency Services",
    fullName: "Detective Lisa Chen",
    status: "Active",
    createdAt: "2025-10-01T09:15:00Z",
  },
];

export default function AccountsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: "ban" | "unban" | "delete";
    user: User;
  } | null>(null);

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
          You do not have permission to access the account management page. This
          page is only available for administrators.
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

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const handleViewDetails = (account: User) => {
    router.push(`/dashboard/accounts/${account.id}`);
  };

  const handleBan = async () => {
    if (!confirmAction || confirmAction.type !== "ban") return;
    try {
      await mockRequest(false);
      setUsers(
        users.map((u) =>
          u.id === confirmAction.user.id
            ? { ...u, status: "Banned" as const }
            : u,
        ),
      );
      toast.success(`Account "${confirmAction.user.username}" has been banned`);
      setConfirmAction(null);
    } catch (error) {
      toast.error("Failed to ban account");
      console.error(error);
    }
  };

  const handleUnban = async () => {
    if (!confirmAction || confirmAction.type !== "unban") return;
    try {
      await mockRequest(false);
      setUsers(
        users.map((u) =>
          u.id === confirmAction.user.id
            ? { ...u, status: "Active" as const }
            : u,
        ),
      );
      toast.success(
        `Account "${confirmAction.user.username}" has been unbanned`,
      );
      setConfirmAction(null);
    } catch (error) {
      toast.error("Failed to unban account");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!confirmAction || confirmAction.type !== "delete") return;
    try {
      await mockRequest(false);
      setUsers(users.filter((u) => u.id !== confirmAction.user.id));
      toast.success(
        `Account "${confirmAction.user.username}" has been deleted`,
      );
      setConfirmAction(null);
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
    }
  };

  const filteredUsers = users.filter((account) => {
    const matchesSearch =
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || account.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || account.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: User["role"]) => {
    switch (role) {
      case "Admin":
        return <Shield className="w-4 h-4 text-purple-600" />;
      case "Reporter":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "Emergency Services":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getRoleBadgeColor = (role: User["role"]) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-700";
      case "Reporter":
        return "bg-blue-100 text-blue-700";
      case "Emergency Services":
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-gray-900 text-xl font-semibold">
          Account Management
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{users.length} total accounts</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Reporter">Reporter</option>
              <option value="Emergency Services">Emergency Services</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">User</th>
                <th className="px-6 py-3 text-left text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {account.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">
                            {account.fullName}
                          </p>
                          <p className="text-gray-500 text-sm">
                            @{account.username} • {account.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${getRoleBadgeColor(
                          account.role,
                        )}`}
                      >
                        {getRoleIcon(account.role)}
                        {account.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeColor(
                          account.status,
                        )}`}
                      >
                        {account.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(account)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {account.id !== user.id && (
                          <>
                            {account.status === "Banned" ? (
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: "unban",
                                    user: account,
                                  })
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Unban Account"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: "ban",
                                    user: account,
                                  })
                                }
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Ban Account"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: "delete",
                                  user: account,
                                })
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modals */}
      {confirmAction?.type === "ban" && (
        <ConfirmModal
          title="Ban Account"
          message={`Are you sure you want to ban the account "${confirmAction.user.username}"? This user will not be able to access the system.`}
          onConfirm={handleBan}
          onCancel={() => setConfirmAction(null)}
          confirmText="Ban Account"
          confirmStyle="danger"
        />
      )}

      {confirmAction?.type === "unban" && (
        <ConfirmModal
          title="Unban Account"
          message={`Are you sure you want to unban the account "${confirmAction.user.username}"? This user will regain access to the system.`}
          onConfirm={handleUnban}
          onCancel={() => setConfirmAction(null)}
          confirmText="Unban Account"
          confirmStyle="primary"
        />
      )}

      {confirmAction?.type === "delete" && (
        <ConfirmModal
          title="Delete Account"
          message={`Are you sure you want to permanently delete the account "${confirmAction.user.username}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmAction(null)}
          confirmText="Delete Account"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
