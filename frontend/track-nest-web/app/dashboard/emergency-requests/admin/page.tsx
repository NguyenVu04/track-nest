"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  emergencyOpsService,
  AdminEmergencyRequestResponse,
} from "@/services/emergencyOpsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations } from "next-intl";

export default function AdminEmergencyRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations("emergencyRequests");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");

  const [requests, setRequests] = useState<AdminEmergencyRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await emergencyOpsService.getAllEmergencyRequests(
          statusFilter || undefined,
          0,
          50,
        );
        setRequests(response.items);
      } catch (error) {
        console.error("Error fetching emergency requests:", error);
        toast.error(t("toastLoadError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [t, statusFilter]);

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  if (!user.role.includes("Admin")) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{tCommon("accessDenied")}</h3>
          <p className="text-gray-500">{t("accessDeniedMessage")}</p>
        </div>
      </div>
    );
  }

  const filteredRequests = requests.filter((r) =>
    r.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":  return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED": return "bg-blue-100 text-blue-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "CLOSED":   return "bg-green-100 text-green-800";
      default:         return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const key = status.toLowerCase() as Parameters<typeof tStatus>[0];
    return tStatus(key);
  };

  const navigateToRequestDetail = (request: AdminEmergencyRequestResponse) => {
    sessionStorage.setItem(
      `emergency-request-detail:${request.id}`,
      JSON.stringify(request),
    );
    router.push(`/dashboard/emergency-requests/${request.id}?from=admin`);
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: t("adminPageTitle") }]} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-xl font-bold">{t("adminPageTitle")}</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent cursor-pointer"
          >
            <option value="">{tCommon("all")}</option>
            <option value="PENDING">{tStatus("pending")}</option>
            <option value="ACCEPTED">{tStatus("accepted")}</option>
            <option value="REJECTED">{tStatus("rejected")}</option>
            <option value="CLOSED">{tStatus("closed")}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">{t("tableId")}</th>
                <th className="px-6 py-3 text-left text-gray-700">{t("tableSender")}</th>
                <th className="px-6 py-3 text-left text-gray-700">{t("tableTarget")}</th>
                <th className="px-6 py-3 text-left text-gray-700">{t("tableService")}</th>
                <th className="px-6 py-3 text-left text-gray-700">{t("tableLocation")}</th>
                <th className="px-6 py-3 text-left text-gray-700">{t("tableStatus")}</th>
                <th className="px-6 py-3 text-left text-gray-700">{t("tableCreated")}</th>
                <th className="px-6 py-3 text-left text-gray-700">{tCommon("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => navigateToRequestDetail(request)}
                      className="text-left text-indigo-600 font-mono text-sm hover:underline"
                    >
                      {request.id.substring(0, 8)}...
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    <div className="font-medium">
                      {request.senderFirstName} {request.senderLastName}
                    </div>
                    <div className="text-sm text-gray-500">@{request.senderUsername}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    <div className="font-medium">
                      {request.targetFirstName} {request.targetLastName}
                    </div>
                    <div className="text-sm text-gray-500">@{request.targetUsername}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    <div className="text-sm font-medium">@{request.serviceUsername}</div>
                    <div className="text-xs text-gray-500">{request.serviceEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {request.targetLastLatitude.toFixed(4)}, {request.targetLastLongitude.toFixed(4)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {new Date(request.openedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigateToRequestDetail(request)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {tCommon("noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
