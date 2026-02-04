"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ClipboardCheck, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { EmergencyRequest } from "@/types";
import { MapView } from "@/components/MapView";
import { toast } from "sonner";

const mockRequests: EmergencyRequest[] = [
  {
    id: "req-001",
    requesterName: "Alex Nguyen",
    requesterContact: "+1 (555) 123-8899",
    location: "Central Park, NYC",
    coordinates: [40.7829, -73.9654],
    createdAt: "2026-01-03T12:30:00Z",
    status: "Pending",
  },
  {
    id: "req-002",
    requesterName: "Maria Lee",
    requesterContact: "+1 (555) 333-2211",
    location: "Downtown Metro Station",
    coordinates: [40.758, -73.9855],
    createdAt: "2026-01-02T18:20:00Z",
    status: "Accepted",
  },
  {
    id: "req-003",
    requesterName: "John Park",
    requesterContact: "+1 (555) 777-4488",
    location: "Upper East Side",
    coordinates: [40.7736, -73.9566],
    createdAt: "2026-01-01T09:10:00Z",
    status: "Rejected",
    rejectReason: "Sai địa chỉ",
  },
];

export default function EmergencyRequestsPage() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [requests, setRequests] = useState<EmergencyRequest[]>(mockRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejecting, setRejecting] = useState<EmergencyRequest | null>(null);
  const [completing, setCompleting] = useState<EmergencyRequest | null>(null);
  const [trackingRequest, setTrackingRequest] =
    useState<EmergencyRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [completionNote, setCompletionNote] = useState("");

  if (!user) return null;

  const mockRequest = async (shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (shouldFail) {
      throw new Error("Mock server error");
    }
  };

  const filteredRequests = requests.filter((r) =>
    r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAccept = async (request: EmergencyRequest) => {
    try {
      await mockRequest(false);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? { ...r, status: "Accepted" } : r,
        ),
      );
      setTrackingRequest(request);
      toast.success("Thành công");
      addNotification({
        type: "emergency",
        title: "Emergency request accepted",
        description: `Request from ${request.requesterName} has been accepted`,
        reportId: request.id,
      });
    } catch (error) {
      toast.error("Lỗi khi tiếp nhận yêu cầu");
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!rejecting || !rejectReason.trim()) return;
    try {
      await mockRequest(false);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejecting.id
            ? { ...r, status: "Rejected", rejectReason }
            : r,
        ),
      );
      toast.success("Thành công");
      addNotification({
        type: "emergency",
        title: "Emergency request rejected",
        description: `Request from ${rejecting.requesterName} was rejected`,
        reportId: rejecting.id,
      });
      setRejecting(null);
      setRejectReason("");
    } catch (error) {
      toast.error("Lỗi khi từ chối yêu cầu khẩn cấp");
      console.error(error);
    }
  };

  const handleComplete = async () => {
    if (!completing || !completionNote.trim()) return;
    try {
      await mockRequest(false);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === completing.id
            ? { ...r, status: "Completed", completionNote }
            : r,
        ),
      );
      if (trackingRequest?.id === completing.id) {
        setTrackingRequest(null);
      }
      toast.success("Thành công");
      addNotification({
        type: "emergency",
        title: "Emergency request completed",
        description: `Request from ${completing.requesterName} completed`,
        reportId: completing.id,
      });
      setCompleting(null);
      setCompletionNote("");
    } catch (error) {
      toast.error("Lỗi khi hoàn thành yêu cầu khẩn cấp");
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 text-xl font-semibold">
          Emergency Requests
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by requester name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Requester</th>
                <th className="px-6 py-3 text-left text-gray-700">Location</th>
                <th className="px-6 py-3 text-left text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-gray-700">Created</th>
                <th className="px-6 py-3 text-left text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{request.requesterName}</div>
                    <div className="text-gray-500 text-sm">
                      {request.requesterContact}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {request.location}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {new Date(request.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {request.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleAccept(request)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Accept"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejecting(request)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {request.status === "Accepted" && (
                        <button
                          onClick={() => setCompleting(request)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Complete"
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
            Live Tracking - {trackingRequest.requesterName}
          </h3>
          <MapView
            center={trackingRequest.coordinates}
            markers={[
              {
                position: trackingRequest.coordinates,
                label: trackingRequest.location,
              },
            ]}
          />
          <p className="text-gray-600 text-sm mt-3">
            Live location tracking is active while the request is accepted.
          </p>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-gray-900">Reject Emergency Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-gray-700">Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                rows={4}
                placeholder="Enter reason (e.g., Quá tải, Sai địa chỉ, Spam)"
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
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {completing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-gray-900">Complete Emergency Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-gray-700">Result *</label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black focus:border-transparent"
                rows={4}
                placeholder="Enter completion note..."
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
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={!completionNote.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                Confirm Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
