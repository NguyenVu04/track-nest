"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle, 
  XCircle, 
  ClipboardCheck, 
  Search, 
  Eye,
  Target,
  ClipboardList,
  MoreVertical,
  Asterisk,
  Phone,
  MapPin as MapPinIcon,
  Maximize2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useEmergencyRequestRealtime } from "@/contexts/EmergencyRequestRealtimeContext";
import { MapView } from "@/components/shared/MapView";
import { toast } from "sonner";
import { emergencyOpsService, EmergencyRequestResponse } from "@/services/emergencyOpsService";
import { Loading } from "@/components/loading/Loading";
import { useTranslations } from "next-intl";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

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
        
        // Auto track first pending or accepted request if none is currently tracked
        if (response.items.length > 0 && !trackingRequest) {
           const activeReq = response.items.find(r => r.status === "ACCEPTED" || r.status === "PENDING");
           if (activeReq) setTrackingRequest(activeReq);
        }

      } catch (error) {
        console.error("Error fetching emergency requests:", error);
        toast.error(t("toastLoadError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [user, t, statusFilter, refresh]); // trackingRequest removed from dependencies to avoid loop

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
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.senderFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.senderLastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":   return "bg-cyan-100 text-cyan-800";
      case "ACCEPTED":  return "bg-red-100 text-red-800";
      case "REJECTED":  return "bg-gray-200 text-gray-800";
      case "CLOSED":    return "bg-gray-100 text-gray-700";
      default:          return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "ACCEPTED") return "In Progress";
    if (status === "PENDING") return "Pending Review";
    if (status === "CLOSED") return "Resolved";
    return status;
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
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

  const mapMarkers = filteredRequests.filter(r => r.status === "PENDING" || r.status === "ACCEPTED").map(r => ({
      position: (trackingRequest?.id === r.id && realtimeLocation) 
        ? [realtimeLocation.latitude, realtimeLocation.longitude] as [number, number]
        : [r.targetLastLatitude, r.targetLastLongitude] as [number, number],
      label: `${r.senderFirstName} ${r.senderLastName}`,
  }));

  const mapCenter = mapMarkers.length > 0 ? mapMarkers[0].position : [0, 0] as [number, number];

  return (
    <div className="max-w-screen-2xl mx-auto pb-10">
      <Breadcrumbs items={[{ label: t("pageTitle") }]} />
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Emergency Hub</h1>
          <p className="text-gray-500 mt-2 max-w-md leading-relaxed text-sm">
            Real-time oversight of all safety incidents and system triggers within your family network.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 min-w-[200px]">
             <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Target className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Hub Requests</p>
                <p className="text-2xl font-black text-gray-900 leading-none">
                  {requests.length.toLocaleString()}
                </p>
             </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 min-w-[200px]">
             <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending SOS</p>
                <p className="text-2xl font-black text-gray-900 leading-none">
                  {pendingCount.toString().padStart(2, '0')}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        
        {/* Left Column: Recent Emergency Alerts */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-[#004d40]">Recent Emergency Alerts</h3>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-9 pr-4 py-1.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-cyan-500 text-sm text-gray-800 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-32 px-3 py-1.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-cyan-500 text-sm text-gray-800 bg-gray-50 focus:bg-white cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">In Progress</option>
                <option value="REJECTED">Rejected</option>
                <option value="CLOSED">Resolved</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4">Sender</th>
                  <th className="px-8 py-4">Type</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="px-8 py-12 text-center text-gray-500">
                        No emergency alerts found.
                     </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => navigateToRequestDetail(request)}>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                              {getInitials(request.senderFirstName, request.senderLastName)}
                           </div>
                           <div>
                              <p className="font-bold text-[#004d40]">
                                {request.senderFirstName} {request.senderLastName}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium">ID: #{request.id.substring(0, 6).toUpperCase()}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2 mb-0.5">
                           {request.status === 'PENDING' || request.status === 'ACCEPTED' ? (
                             <Asterisk className="w-[18px] h-[18px] text-red-600 shrink-0" strokeWidth={3} />
                           ) : (
                             <AlertTriangle className="w-[16px] h-[16px] text-gray-500 shrink-0" strokeWidth={2.5} />
                           )}
                           <span className={`font-bold ${request.status === 'PENDING' || request.status === 'ACCEPTED' ? 'text-red-600' : 'text-gray-700'}`}>
                             SOS Trigger
                           </span>
                        </div>
                        <p className="text-[12px] text-gray-500 ml-[26px]">Emergency Alert</p>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-2 text-gray-400 hover:text-[#004d40] hover:bg-teal-50 rounded-full transition-colors outline-none focus:ring-2 focus:ring-teal-100">
                             <MoreVertical className="w-5 h-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border-gray-100 p-1">
                             <DropdownMenuItem onClick={() => navigateToRequestDetail(request)} className="rounded-lg cursor-pointer font-medium text-gray-700 focus:bg-teal-50 focus:text-[#004d40]">
                               <Eye className="w-4 h-4 mr-2" /> View Details
                             </DropdownMenuItem>
                             {request.status === "PENDING" && user.role.includes("Emergency Service") && (
                               <>
                                 <DropdownMenuItem onClick={() => handleAccept(request)} className="rounded-lg cursor-pointer font-medium text-green-700 focus:bg-green-50 focus:text-green-800">
                                   <CheckCircle className="w-4 h-4 mr-2" /> Accept
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => setRejecting(request)} className="rounded-lg cursor-pointer font-medium text-red-700 focus:bg-red-50 focus:text-red-800">
                                   <XCircle className="w-4 h-4 mr-2" /> Reject
                                 </DropdownMenuItem>
                               </>
                             )}
                             {request.status === "ACCEPTED" && user.role.includes("Emergency Service") && (
                                <DropdownMenuItem onClick={() => setCompleting(request)} className="rounded-lg cursor-pointer font-medium text-blue-700 focus:bg-blue-50 focus:text-blue-800">
                                   <ClipboardCheck className="w-4 h-4 mr-2" /> Resolve
                                </DropdownMenuItem>
                             )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30 text-center">
            <button className="text-sm font-bold text-cyan-700 hover:text-cyan-800 transition-colors">
               View All Alert History
            </button>
          </div>
        </div>

        {/* Right Column: Map & Utilities */}
        <div className="space-y-6">
          {/* Active Incidents Map */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
             <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 z-10 bg-white">
               <h3 className="text-base font-bold text-[#004d40]">Active Incidents Map</h3>
               <button className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors">
                  <Maximize2 className="w-4 h-4" />
               </button>
             </div>
             <div className="flex-1 relative bg-gray-100">
                {mapMarkers.length > 0 ? (
                  <MapView
                    center={mapCenter}
                    markers={mapMarkers}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 font-medium text-sm">
                    No active incidents to map.
                  </div>
                )}
             </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h3>
             <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 py-4 rounded-2xl transition-colors">
                   <Phone className="w-5 h-5 text-teal-600" />
                   <span className="text-xs font-bold text-gray-700">Call Local 911</span>
                </button>
                <button className="flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 py-4 rounded-2xl transition-colors">
                   <MapPinIcon className="w-5 h-5 text-teal-600" />
                   <span className="text-xs font-bold text-gray-700">Broadcast Loc</span>
                </button>
             </div>
          </div>

          {/* System Status */}
          <div className="bg-[#f0f9f9] rounded-[2rem] p-6 relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-base font-bold text-cyan-800 mb-3">System Status</h3>
                <ul className="space-y-2">
                   <li className="flex items-center gap-2 text-sm font-medium text-cyan-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                      All GPS nodes active
                   </li>
                   <li className="flex items-center gap-2 text-sm font-medium text-cyan-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                      Latency: 24ms
                   </li>
                </ul>
             </div>
             {/* Decorative Background Icon */}
             <CheckCircle className="absolute -bottom-6 -right-6 w-32 h-32 text-cyan-100/50" strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Modals remain mostly unchanged in function, slightly refined styling */}
      {rejecting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{t("rejectModalTitle")}</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">{t("rejectReasonLabel")}{tCommon("requiredSuffix")}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 text-black focus:border-transparent transition-all resize-none"
                rows={4}
                placeholder={t("rejectReasonPlaceholder")}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setRejecting(null);
                  setRejectReason("");
                }}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 font-bold text-sm"
              >
                {t("confirmReject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {completing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{t("closeModalTitle")}</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">{t("clNoteLabel")}{tCommon("requiredSuffix")}</label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent transition-all resize-none"
                rows={4}
                placeholder={t("closeNotePlaceholder")}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setCompleting(null);
                  setCompletionNote("");
                }}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleClose}
                disabled={!completionNote.trim()}
                className="px-5 py-2.5 bg-[#004d40] text-white rounded-xl hover:bg-[#00332a] transition-colors disabled:opacity-60 font-bold text-sm"
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
