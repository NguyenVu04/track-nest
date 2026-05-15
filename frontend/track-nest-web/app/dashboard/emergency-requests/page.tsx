"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, ClipboardCheck, Search, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useEmergencyRequestRealtime } from "@/contexts/EmergencyRequestRealtimeContext";
import { MapView } from "@/components/shared/MapView";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  emergencyOpsService,
  EmergencyRequestResponse,
} from "@/services/emergencyOpsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations } from "next-intl";

export default function EmergencyRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { refresh, realtimeLocation } = useEmergencyRequestRealtime();
  const t = useTranslations("emergencyRequests");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");

  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [rejecting, setRejecting] = useState<EmergencyRequestResponse | null>(null);
  const [completing, setCompleting] = useState<EmergencyRequestResponse | null>(null);
  const [trackingRequest, setTrackingRequest] = useState<EmergencyRequestResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [completionNote, setCompletionNote] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await emergencyOpsService.getEmergencyRequests(
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
  }, [user, t, statusFilter, refresh]);

  if (!user) return null;
  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!user.role.includes("Emergency Service")) {
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
      case "PENDING":   return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":  return "bg-blue-100 text-blue-800";
      case "REJECTED":  return "bg-red-100 text-red-800";
      case "CLOSED":    return "bg-green-100 text-green-800";
      default:          return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const key = status.toLowerCase() as Parameters<typeof tStatus>[0];
    return tStatus(key);
  };

  const navigateToRequestDetail = (request: EmergencyRequestResponse) => {
    sessionStorage.setItem(
      `emergency-request-detail:${request.id}`,
      JSON.stringify(request),
    );
    router.push(`/dashboard/emergency-requests/${request.id}`);
  };

  const handleAccept = async (request: EmergencyRequestResponse) => {
    try {
      await emergencyOpsService.acceptEmergencyRequest(request.id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? { ...r, status: "ACCEPTED" } : r,
        ),
      );
      setTrackingRequest({ ...request, status: "ACCEPTED" });
      toast.success(t("toastAccepted"));
      addNotification({
        type: "emergency",
        title: "Emergency request accepted",
        description: `Emergency request #${request.id} has been accepted`,
        reportId: request.id,
      });
    } catch (error) {
      toast.error(t("toastAcceptError"));
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!rejecting || !rejectReason.trim()) return;
    try {
      await emergencyOpsService.rejectEmergencyRequest(rejecting.id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejecting.id
            ? { ...r, status: "REJECTED" }
            : r,
        ),
      );
      toast.success(t("toastRejected"));
      setRejecting(null);
      setRejectReason("");
    } catch (error) {
      toast.error(t("toastRejectError"));
      console.error(error);
    }
  };

  const handleClose = async () => {
    if (!completing || !completionNote.trim()) return;
    try {
      const response = await emergencyOpsService.closeEmergencyRequest(completing.id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === completing.id
            ? { ...r, status: "CLOSED", closedAt: response.closedAtMs ?? Date.now() }
            : r,
        ),
      );
      if (trackingRequest?.id === completing.id) {
        setTrackingRequest(null);
      }
      toast.success(t("toastClosed"));
      setCompleting(null);
      setCompletionNote("");
    } catch (error) {
      toast.error(t("toastCloseError"));
      console.error(error);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: t("pageTitle") }]} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-xl font-bold">{t("pageTitle")}</h2>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigateToRequestDetail(request)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === "PENDING" && user.role.includes("Emergency Service") && (
                        <>
                          <button
                            onClick={() => handleAccept(request)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title={t("accept")}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejecting(request)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t("reject")}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {request.status === "ACCEPTED" && user.role.includes("Emergency Service") && (
                        <button
                          onClick={() => setCompleting(request)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t("close")}
                        >
                          <ClipboardCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {trackingRequest && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-gray-900 mb-4">
            {t("trackingTitle", { id: trackingRequest.id.substring(0, 8) })}
          </h3>
          <MapView
            center={
              realtimeLocation
                ? [realtimeLocation.latitude, realtimeLocation.longitude]
                : [trackingRequest.targetLastLatitude, trackingRequest.targetLastLongitude]
            }
            markers={[
              {
                position: realtimeLocation
                  ? [realtimeLocation.latitude, realtimeLocation.longitude]
                  : [trackingRequest.targetLastLatitude, trackingRequest.targetLastLongitude],
                label: realtimeLocation ? "Live Location" : "Emergency Location",
              },
            ]}
          />
          <p className="text-gray-600 text-sm mt-3">
            {realtimeLocation
              ? `${t("trackingActive")} · Live update at ${new Date(realtimeLocation.timestamp).toLocaleTimeString()}`
              : t("trackingActive")}
          </p>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-gray-900">{t("rejectModalTitle")}</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-gray-700">{t("rejectReasonLabel")}{tCommon("requiredSuffix")}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                rows={4}
                placeholder={t("rejectReasonPlaceholder")}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setRejecting(null);
                  setRejectReason("");
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {t("confirmReject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {completing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-gray-900">{t("closeModalTitle")}</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-gray-700">{t("clNoteLabel")}{tCommon("requiredSuffix")}</label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                rows={4}
                placeholder={t("closeNotePlaceholder")}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setCompleting(null);
                  setCompletionNote("");
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleClose}
                disabled={!completionNote.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {t("confirmClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
