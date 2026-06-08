import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { authService } from "./authService";

type WsUrlProvider = () => string;
type TokenProvider = () => Promise<string | null>;

export interface ManagedStompSubscription {
  unsubscribe: () => void;
}

export interface ManagedStompService {
  connect: () => Promise<void>;
  subscribe: (
    destination: string,
    callback: (message: IMessage) => void,
  ) => ManagedStompSubscription;
  reconnect: () => Promise<void>;
  disconnect: () => void;
  isConnected: () => boolean;
}

interface SubEntry {
  destination: string;
  callback: (message: IMessage) => void;
  active: StompSubscription | null;
}

const RECONNECT_BACKOFF_MS = 2000;

export function createStompService(
  getWsUrl: WsUrlProvider,
  getToken: TokenProvider,
): ManagedStompService {
  let client: Client | null = null;
  let connectPromise: Promise<void> | null = null;
  let intentionallyClosed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const subs = new Map<symbol, SubEntry>();

  function clearReconnectTimer(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  async function activate(): Promise<void> {
    const token = await getToken();
    if (!token) {
      throw new Error("[STOMP] No access token available for handshake");
    }
    const wsUrl = getWsUrl();
    intentionallyClosed = false;

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const c = new Client({
        webSocketFactory: () =>
          new SockJS(`${wsUrl}?access_token=${encodeURIComponent(token)}`),
        // stompjs auto-reconnect re-uses the same webSocketFactory closure,
        // which would keep using the stale token captured above. Disable it
        // and manage reconnects ourselves via onWebSocketClose so each retry
        // fetches a fresh JWT through getToken().
        reconnectDelay: 0,
        onConnect: () => {
          // (Re-)subscribe everything that was queued or was active before the drop
          subs.forEach((entry) => {
            if (!entry.active) {
              entry.active = c.subscribe(entry.destination, entry.callback);
            }
          });
          if (!settled) {
            settled = true;
            resolve();
          }
        },
        onStompError: (frame) => {
          console.error(
            "[STOMP] error frame:",
            frame.headers["message"],
            frame.body,
          );
          if (!settled) {
            settled = true;
            reject(
              new Error(frame.headers["message"] ?? "STOMP connection error"),
            );
          }
        },
        onWebSocketClose: (evt) => {
          subs.forEach((entry) => {
            entry.active = null;
          });
          if (intentionallyClosed || subs.size === 0) {
            return;
          }
          console.warn(
            `[STOMP] socket closed (code=${evt?.code ?? "n/a"}); reconnecting with fresh token`,
          );
          clearReconnectTimer();
          reconnectTimer = setTimeout(() => {
            connectPromise = null;
            service.connect().catch((err) =>
              console.error("[STOMP] reconnect failed:", err),
            );
          }, RECONNECT_BACKOFF_MS);
        },
      });
      client = c;
      c.activate();
    });
  }

  const service: ManagedStompService = {
    connect() {
      if (client?.connected) return Promise.resolve();
      if (connectPromise) return connectPromise;
      connectPromise = activate().catch((err) => {
        connectPromise = null;
        throw err;
      });
      return connectPromise;
    },

    subscribe(destination, callback) {
      const key = Symbol(destination);
      const entry: SubEntry = { destination, callback, active: null };
      subs.set(key, entry);

      if (client?.connected) {
        entry.active = client.subscribe(destination, callback);
      } else {
        // Trigger connect lazily; the entry will be subscribed inside onConnect.
        // This removes the race where fromStompChannel.subscribe ran before
        // the STOMP CONNECTED frame and returned null.
        service.connect().catch((err) =>
          console.error(
            "[STOMP] auto-connect failed; subscription pending until next reconnect:",
            err,
          ),
        );
      }

      return {
        unsubscribe() {
          subs.delete(key);
          try {
            entry.active?.unsubscribe();
          } catch (e) {
            console.warn("[STOMP] unsubscribe failed:", e);
          }
          entry.active = null;
        },
      };
    },

    async reconnect() {
      clearReconnectTimer();
      intentionallyClosed = true;
      try {
        await client?.deactivate();
      } catch (e) {
        console.warn("[STOMP] deactivate during reconnect failed:", e);
      }
      client = null;
      connectPromise = null;
      subs.forEach((entry) => {
        entry.active = null;
      });
      return service.connect();
    },

    disconnect() {
      clearReconnectTimer();
      intentionallyClosed = true;
      client?.deactivate().catch(() => {});
      client = null;
      connectPromise = null;
      subs.clear();
    },

    isConnected: () => client?.connected ?? false,
  };

  return service;
}

function upgradeForHttps(base: string): string {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return base.replace(/^http:/, "https:");
  }
  return base;
}

function resolveEmergencyOpsWsUrl(): string {
  // Priority: explicit WS env var → derive /ws from REST URL → localhost fallback
  const base =
    process.env.NEXT_PUBLIC_EMERGENCY_OPS_WS_URL ||
    (process.env.NEXT_PUBLIC_EMERGENCY_OPS_API_URL
      ? `${process.env.NEXT_PUBLIC_EMERGENCY_OPS_API_URL.replace(/\/$/, "")}/ws`
      : "http://localhost:8800/emergency-ops/ws");
  return upgradeForHttps(base);
}

function resolveCriminalReportsWsUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_CRIMINAL_REPORTS_WS_URL ||
    (process.env.NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL
      ? `${process.env.NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL.replace(/\/$/, "")}/ws`
      : "http://localhost:8800/criminal-reports/ws");
  return upgradeForHttps(base);
}

const freshToken: TokenProvider = () => authService.getFreshAccessToken();

export const emergencyOpsStomp = createStompService(
  resolveEmergencyOpsWsUrl,
  freshToken,
);

export const criminalReportsStomp = createStompService(
  resolveCriminalReportsWsUrl,
  freshToken,
);

// Backward-compatible default export — historical callers reference the
// emergency-ops connection as the "main" STOMP client.
const stompService = emergencyOpsStomp;
export default stompService;
