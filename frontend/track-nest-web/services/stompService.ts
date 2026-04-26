import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_EMERGENCY_OPS_WS_URL ||
  "http://localhost:8800/emergency-ops/ws";

let client: Client | null = null;

const stompService = {
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      client = new Client({
        webSocketFactory: () =>
          new SockJS(`${WS_BASE_URL}?access_token=${encodeURIComponent(token)}`),
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
