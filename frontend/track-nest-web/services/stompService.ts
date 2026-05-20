import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function resolveWsUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_EMERGENCY_OPS_WS_URL ||
    "http://localhost:8800/emergency-ops/ws";
  // Browsers block http:// SockJS connections from https:// pages (mixed content).
  // Upgrade the URL protocol automatically so the same env var works for both
  // dev (HTTP) and production (HTTPS).
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return base.replace(/^http:/, "https:");
  }
  return base;
}

let client: Client | null = null;

const stompService = {
  connect(token: string): Promise<void> {
    const wsUrl = resolveWsUrl();
    return new Promise((resolve, reject) => {
      client = new Client({
        webSocketFactory: () =>
          new SockJS(`${wsUrl}?access_token=${encodeURIComponent(token)}`),
        reconnectDelay: 5000,
        onConnect: () => resolve(),
        onStompError: (frame) => {
          console.error("STOMP error", frame);
          reject(new Error(frame.headers["message"] ?? "STOMP connection error"));
        },
      });
      client.activate();
    });
  },

  subscribe(
    destination: string,
    callback: (message: IMessage) => void,
  ): StompSubscription | null {
    if (!client?.connected) return null;
    return client.subscribe(destination, callback);
  },

  disconnect(): void {
    client?.deactivate();
    client = null;
  },

  isConnected(): boolean {
    return client?.connected ?? false;
  },
};

export default stompService;
