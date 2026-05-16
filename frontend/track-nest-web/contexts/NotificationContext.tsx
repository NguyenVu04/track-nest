"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";

export type NotificationType = "crime" | "missing-person" | "emergency" | "guideline";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  reportId: string;
  timestamp: number;
  read: boolean;
}

// ─── Action discriminated union ───────────────────────────────────────────────

type NotificationAction =
  | { type: "ADD"; payload: Omit<Notification, "id" | "timestamp" | "read"> }
  | { type: "MARK_READ"; id: string }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" };

// ─── Pure reducer — no React deps, fully unit-testable ────────────────────────

export function notificationReducer(
  state: Notification[],
  action: NotificationAction,
): Notification[] {
  switch (action.type) {
    case "ADD":
      return [
        {
          ...action.payload,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          read: false,
        },
        ...state,
      ];
    case "MARK_READ":
      return state.map((n) =>
        n.id === action.id ? { ...n, read: true } : n,
      );
    case "REMOVE":
      return state.filter((n) => n.id !== action.id);
    case "CLEAR":
      return [];
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  // Stable ref — survives re-renders; useRef prevents Strict Mode double-creation
  const action$ = useRef(new Subject<NotificationAction>()).current;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // scan accumulates actions into state; setNotifications bridges to React
    const sub = action$
      .pipe(scan(notificationReducer, []))
      .subscribe(setNotifications);
    return () => sub.unsubscribe();
  }, []); // action$ is a stable ref — no deps needed

  // Public API is unchanged; each method dispatches an action to the Subject
  const addNotification = useCallback(
    (payload: Omit<Notification, "id" | "timestamp" | "read">) =>
      action$.next({ type: "ADD", payload }),
    [action$],
  );

  const markAsRead = useCallback(
    (id: string) => action$.next({ type: "MARK_READ", id }),
    [action$],
  );

  const removeNotification = useCallback(
    (id: string) => action$.next({ type: "REMOVE", id }),
    [action$],
  );

  const clearAll = useCallback(
    () => action$.next({ type: "CLEAR" }),
    [action$],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    clearAll,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}
