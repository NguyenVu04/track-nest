"use client";

import { useState, useEffect } from "react";
import { Clock, LifeBuoy, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmergencyRequestRealtime } from "@/contexts/EmergencyRequestRealtimeContext";
import { emergencyOpsService, EmergencyRequestResponse } from "@/services/emergencyOpsService";
import { Loading } from "@/components/loading/Loading";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

function formatDateTime(value?: number) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-cyan-100 text-cyan-800",
  ACCEPTED: "bg-red-100 text-red-800",
  REJECTED: "bg-gray-200 text-gray-700",
  CLOSED:   "bg-gray-100 text-gray-600",
};

export default function MyEmergencyRequestsPage() {
  const { user } = useAuth();
  const { refresh } = useEmergencyRequestRealtime();
  const t = useTranslations("emergencyRequests");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");

  const getStatusLabel = (status: string) => {
    if (status === "ACCEPTED") return t("statusLabelInProgress");
    if (status === "PENDING") return t("statusLabelPendingReview");
    if (status === "CLOSED") return t("statusLabelResolved");
    return tStatus(status.toLowerCase() as Parameters<typeof tStatus>[0]);
  };

  const [requests, setRequests] = useState<EmergencyRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      try {
        const response = await emergencyOpsService.getUserEmergencyRequests(0, 50);
        setRequests(response.items);
      } catch {
        toast.error(t("toastLoadError"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [user, t, refresh]);

  if (!user) return null;
  if (isLoading) return <Loading fullScreen />;

  if (!user.role.includes("Reporter")) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{tCommon("accessDenied")}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto pb-10">
      <Breadcrumbs items={[{ label: t("myPageTitle") }]} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t("myPageTitle")}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {t("myPageSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <RefreshCw className="w-3.5 h-3.5" />
          {t("autoRefreshText")}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <LifeBuoy className="w-12 h-12 mb-4 text-gray-200" />
            <p className="font-semibold text-base">{t("emptyTitle")}</p>
            <p className="text-sm mt-1">{t("emptySubtitle")}</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-8 py-4">{t("tableId")}</th>
                <th className="px-8 py-4">{t("tableTarget")}</th>
                <th className="px-8 py-4">{t("tableStatus")}</th>
                <th className="px-8 py-4">{t("colOpenedAt")}</th>
                <th className="px-8 py-4">{t("colClosedAt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <span className="font-mono font-bold text-gray-700 text-xs">
                      #{req.id.substring(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-bold text-gray-800">
                      {req.targetFirstName} {req.targetLastName}
                    </p>
                    <p className="text-xs text-gray-400">{req.targetEmail}</p>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      {(req.status === "PENDING" || req.status === "ACCEPTED") && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                      )}
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide ${STATUS_COLOR[req.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{formatDateTime(req.openedAt)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-gray-400">
                    {req.closedAt ? formatDateTime(req.closedAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
