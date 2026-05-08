import { getAuthMetadata, getEmergencyUrl, getUserTrackingHttpUrl } from "@/utils";
import axios from "axios";

// ── Request shapes (mirror backend records) ──────────────────────────────────

export interface EmergencyRequestNotificationRequest {
  serviceId: string;
  requestId: string;
  targetId: string;
  targetUsername: string;
  serviceUsername: string;
}

export interface EmergencyRequestNotificationResponse {
  requestId: string;
  timestampMs: number;
  websocketDestination: string;
  kafkaTopic: string;
}

export interface FamilyMessageNotificationRequest {
  circleId: string;
  senderId: string;
  senderName: string;
  content: string;
}

export interface FamilyMessageNotificationResponse {
  circleId: string;
  tokensSent: number;
  note: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

async function authHeaders() {
  const meta = await getAuthMetadata();
  return { Authorization: meta.Authorization, "Content-Type": "application/json" };
}

/**
 * Sends a test emergency-request notification.
 * Triggers both the WebSocket push to the emergency-service dashboard
 * and the Kafka → FCM push to the target user's device.
 *
 * Endpoint: POST {emergencyUrl}/test/notifications/emergency-request
 */
export async function sendTestEmergencyRequestNotification(
  req: EmergencyRequestNotificationRequest,
): Promise<EmergencyRequestNotificationResponse> {
  const baseUrl = await getEmergencyUrl();
  const headers = await authHeaders();
  const response = await axios.post<EmergencyRequestNotificationResponse>(
    `${baseUrl}/test/notifications/emergency-request`,
    req,
    { headers },
  );
  return response.data;
}

/**
 * Sends a test family-message FCM notification to all circle members
 * except the sender.
 *
 * Endpoint: POST {userTrackingHttpUrl}/test/notifications/family-message
 */
export async function sendTestFamilyMessageNotification(
  req: FamilyMessageNotificationRequest,
): Promise<FamilyMessageNotificationResponse> {
  const baseUrl = await getUserTrackingHttpUrl();
  const headers = await authHeaders();
  const response = await axios.post<FamilyMessageNotificationResponse>(
    `${baseUrl}/test/notifications/family-message`,
    req,
    { headers },
  );
  return response.data;
}
