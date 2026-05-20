import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function resolveWsUrl(): string {
  // Priority order:
  //   1. Explicit WS env var (NEXT_PUBLIC_EMERGENCY_OPS_WS_URL)
  //   2. Derive /ws from the REST API env var (NEXT_PUBLIC_EMERGENCY_OPS_API_URL)
  //      — both share the same Envoy host so this is always correct in production.
  //   3. Local-dev fallback (localhost:8800)
  // Browsers block http:// SockJS connections from https:// pages (mixed content),
  // so upgrade http: → https: whenever the page itself is on HTTPS.
  const base =
    process.env.NEXT_PUBLIC_EMERGENCY_OPS_WS_URL ||
    (process.env.NEXT_PUBLIC_EMERGENCY_OPS_API_URL
      ? `${process.env.NEXT_PUBLIC_EMERGENCY_OPS_API_URL.replace(/\/$/, "")}/ws`
      : "http://localhost:8800/emergency-ops/ws");
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
