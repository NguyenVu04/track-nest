# RxJS Integration Plan — TrackNest Web Frontend

## Overview

This document outlines the phased plan for integrating RxJS into the TrackNest web frontend. The goal is to replace manual async patterns (`cancelled` flags, `isActive` guards, `useDebouncedCallback`, hand-rolled promise singletons) with declarative observable pipelines.

**RxJS version:** 7.8.x (already present as a transitive dependency — this plan pins it as a direct one)  
**Stack:** Next.js 16 App Router · React 19 · TypeScript 5 · Tailwind v4

---

## Problem Summary

| Pattern | Locations | Issue |
|---|---|---|
| `let cancelled = false` guard | `missing-persons/page`, `guidelines/page`, `crime-reports/page`, `EmergencyRequestRealtimeContext` | Manual stale-response cancellation; error-prone |
| `let isActive = true` guard | `ChatbotPanel` (×5 guards) | Repeated, scattered, easy to miss |
| `useDebouncedCallback` | All three list pages | External library; couples debounce to component state |
| Two STOMP subscription refs | `EmergencyRequestRealtimeContext` | Manual lifecycle; two separate cleanup paths |
| Module-level `keycloakInitPromise` | `authService` | Hand-rolled `shareReplay(1)`; not composable |
| Three separate `useState` mutators | `NotificationContext` | Reducer logic spread across callbacks |

---

## Cross-Cutting Rules

These apply to **every phase**:

1. **Never create `Subject`/`BehaviorSubject` at module scope in `"use client"` files.** Use `useRef(new Subject())` inside the component so React controls the lifecycle.
2. **`takeUntil(destroy$)` goes last in every pipe** (or second-to-last before a trailing `catchError`). Placing it earlier silently swallows errors.
3. **Keep `useState` as the React-facing layer.** Observables feed `setState`; they do not replace JSX state. Components stay testable without RxJS test infrastructure.
4. **Strict Mode safety.** React 19 double-invokes effects in dev. Every `useEffect` that creates a subscription must return `() => subscription.unsubscribe()` (or `completeDestroy$`). Use `defer()` for cold observables so each subscription re-executes the factory rather than sharing a cached result.
5. **SSR safety.** Any observable that touches `window`/`sessionStorage`/`document` must be created inside an effect or guarded by `typeof window !== 'undefined'`. Module-level observable factories in `services/` files are safe as long as they are lazy (`defer`).

---

## Phase 0 — Install

**Files changed:** `package.json`  
**Depends on:** nothing  
**Can ship alone:** ✓

```bash
pnpm add rxjs
```

RxJS 7.8 is already resolved transitively. This step pins it as a direct dependency so imports are reliable and the version is explicitly managed.

No other packages are required. RxJS 7 ships its own TypeScript types.

---

## Phase 1 — Shared Utilities

**Files to create:**
- `lib/rxjs-helpers.ts`
- `hooks/useObservable.ts`

**Depends on:** Phase 0  
**Can ship alone:** ✓ (new files only, no existing code touched)

Create these before any feature work so each feature PR imports from a stable location.

### `lib/rxjs-helpers.ts`

Three small helpers used across every feature:

```ts
import { Subject, Observable, fromEventPattern } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { stompService } from '@/services/stompService';

/** Creates a subject that signals component teardown. */
export function createDestroy$(): Subject<void> {
  return new Subject<void>();
}

/** Completes a destroy subject — call this in useEffect cleanup. */
export function completeDestroy$(subject: Subject<void>): void {
  subject.next();
  subject.complete();
}

/**
 * Wraps a STOMP channel into an Observable<IMessage>.
 * Subscribes on subscribe, unsubscribes on teardown.
 */
export function fromStompChannel(destination: string): Observable<IMessage> {
  return fromEventPattern<IMessage>(
    (handler) => stompService.subscribe(destination, handler),
    (_, sub) => sub?.unsubscribe(),
  );
}
```

### `hooks/useObservable.ts`

A React/RxJS boundary adapter. Subscribes to any `Observable<T>` inside a `useEffect`, pushes emitted values into `useState`, and unsubscribes on unmount.

```ts
import { useState, useEffect } from 'react';
import { Observable } from 'rxjs';

interface ObservableState<T> {
  value: T | undefined;
  error: unknown;
  isLoading: boolean;
}

export function useObservable<T>(
  source$: Observable<T>,
  initialValue?: T,
): ObservableState<T> {
  const [state, setState] = useState<ObservableState<T>>({
    value: initialValue,
    error: undefined,
    isLoading: true,
  });

  useEffect(() => {
    const subscription = source$.subscribe({
      next:  (value) => setState({ value, error: undefined, isLoading: false }),
      error: (error) => setState((s) => ({ ...s, error, isLoading: false })),
    });
    return () => subscription.unsubscribe();
  }, [source$]); // caller must stabilise the reference (useMemo / useRef)

  return state;
}
```

> **Note:** Callers must stabilise the `source$` reference with `useMemo` or `useRef` to prevent the effect from re-subscribing on every render.

---

## Phase 2 — `EmergencyRequestRealtimeContext` ⭐ High Priority

**File to modify:** `contexts/EmergencyRequestRealtimeContext.tsx`  
**Depends on:** Phase 1  
**Can ship alone:** ✓

### What the current code does

| Lines | What it does | Problem |
|---|---|---|
| 47–48 | Two `useRef<StompSubscription \| null>` | Two separate cleanup paths |
| 56 | `let cancelled = false` | Manual stale-closure guard |
| 58–105 | `.then()` chain: connect → subscribe ×2 | Imperative; hard to trace error paths |
| 107–114 | Cleanup: `.unsubscribe()` ×2 + `disconnect()` | Duplicated teardown logic |
| 45 | `const [refresh, setRefresh] = useState(0)` | Integer counter used as a downstream event trigger |

### Replacement

```ts
useEffect(() => {
  if (!token) return;

  const destroy$ = createDestroy$();

  // connect$ is lazy — each subscriber re-runs the connect factory
  const connect$ = defer(() => from(stompService.connect(token)));

  // Emergency request channel
  connect$.pipe(
    switchMap(() => fromStompChannel('/user/queue/emergency-request')),
    takeUntil(destroy$),
  ).subscribe({
    next:  (msg) => handleEmergencyMessage(msg),
    error: (err) => console.error('[STOMP] emergency channel error:', err),
  });

  // Live location channel
  connect$.pipe(
    switchMap(() => fromStompChannel('/user/queue/user-location')),
    takeUntil(destroy$),
  ).subscribe({
    next:  (msg) => handleLocationMessage(msg),
    error: (err) => console.error('[STOMP] location channel error:', err),
  });

  return () => {
    completeDestroy$(destroy$);
    stompService.disconnect();
  };
}, [token]);
```

### What is removed

- `subscriptionRef` and `locationSubscriptionRef` `useRef` declarations
- `let cancelled = false`
- Both `.unsubscribe()` calls in cleanup
- The `.then()` callback chain

### What stays unchanged

- `refresh: number` and `realtimeLocation` in the context value
- All downstream pages that read `refresh` via `useEmergencyRequestRealtime()` — no changes needed there

### Strict Mode note

`defer` wraps the connect call so each subscription re-executes `stompService.connect()`. In dev, the double-mount cleanly disconnects the first subscription and re-connects for the second.

---

## Phase 3 — List Page Search + Fetch ⭐ High Priority

**Files to modify:**
- `app/dashboard/missing-persons/page.tsx`
- `app/dashboard/crime-reports/page.tsx`
- `app/dashboard/guidelines/page.tsx`

**File to create:** `hooks/usePagedList.ts`  
**Depends on:** Phase 1  
**Can ship alone:** ✓ (three pages + one new hook; no other files touched)

### What the current code does (identical pattern in all three pages)

| Element | Current | Problem |
|---|---|---|
| Debounce | `useDebouncedCallback(fn, 400)` from `use-debounce` | External dep; tightly coupled to component re-renders |
| Stale response guard | `let cancelled = false` + `if (cancelled) return` | Manual; easy to miss a guard placement |
| Delete-triggered refresh | `setRefreshKey(k => k + 1)` | Semantic-free integer bump |
| Effect deps | `[user, currentPage, activeTab, searchTitle, refreshKey]` | Long; any change re-triggers the full fetch |

### New shared hook: `hooks/usePagedList.ts`

```ts
import { useRef, useState, useEffect } from 'react';
import { BehaviorSubject, Subject, combineLatest, from, EMPTY } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

interface PagedListParams {
  page: number;
  size: number;
  searchTitle: string;
  tab: string;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

interface UsePagedListResult<T> {
  items: T[];
  totalPages: number;
  totalElements: number;
  isLoading: boolean;
  error: unknown;
  setSearch: (value: string) => void;
  setTab: (value: string) => void;
  setPage: (value: number) => void;
  refresh: () => void;
}

export function usePagedList<T>(
  fetchFn: (params: PagedListParams) => Promise<PageResponse<T>>,
  initialTab = '',
  initialPage = 0,
  size = 10,
): UsePagedListResult<T> {
  const search$  = useRef(new BehaviorSubject('')).current;
  const tab$     = useRef(new BehaviorSubject(initialTab)).current;
  const page$    = useRef(new BehaviorSubject(initialPage)).current;
  const refresh$ = useRef(new Subject<void>()).current;

  const [items, setItems]               = useState<T[]>([]);
  const [totalPages, setTotalPages]     = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<unknown>(undefined);

  useEffect(() => {
    const debounced$ = search$.pipe(debounceTime(400), distinctUntilChanged());

    const params$ = combineLatest([debounced$, tab$, page$]).pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    );

    const subscription = params$.pipe(
      switchMap(([searchTitle, tab, page]) => {
        setIsLoading(true);
        return from(fetchFn({ page, size, searchTitle, tab })).pipe(
          catchError((err) => { setError(err); setIsLoading(false); return EMPTY; }),
        );
      }),
    ).subscribe((response) => {
      setItems(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setIsLoading(false);
      setError(undefined);
    });

    // refresh$ re-emits the latest params to trigger a refetch
    const refreshSub = refresh$.pipe(
      switchMap(() => params$.pipe(
        switchMap(([searchTitle, tab, page]) =>
          from(fetchFn({ page, size, searchTitle, tab })).pipe(
            catchError((err) => { setError(err); return EMPTY; }),
          )
        ),
      )),
    ).subscribe((response) => {
      setItems(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    });

    return () => {
      subscription.unsubscribe();
      refreshSub.unsubscribe();
    };
  }, []); // stable refs — no deps needed

  return {
    items, totalPages, totalElements, isLoading, error,
    setSearch: (v) => search$.next(v),
    setTab:    (v) => { tab$.next(v); page$.next(0); },
    setPage:   (v) => page$.next(v),
    refresh:   ()  => refresh$.next(),
  };
}
```

### Per-page migration changes

**`missing-persons/page.tsx`**
- Remove `useDebouncedCallback` import and declaration
- Remove `let cancelled = false` + entire `useEffect` fetch block
- Remove `refreshKey` state
- Replace `setRefreshKey(k => k + 1)` on delete with `refresh()` from hook
- Replace `debouncedSetTitle(e.target.value)` with `setSearch(e.target.value)`
- Replace tab button `onClick` with `setTab(tab.id)`
- Replace pagination `setCurrentPage(p)` with `setPage(p)`

**`crime-reports/page.tsx`** — identical changes; `severityFilter` maps to `tab`.

**`guidelines/page.tsx`** — identical changes; `statusFilter` maps to `tab`.

### `switchMap` cancellation

When params change before the previous fetch resolves, `switchMap` automatically unsubscribes from the inner observable. The `cancelled` flag is no longer needed. Axios does not cancel the underlying HTTP request unless an `AbortController` is passed, but the response is silently dropped — functionally equivalent to the current `if (cancelled) return` guard.

> **Optional enhancement (not required):** Pass `signal: controller.signal` from an `AbortController` to `fetchFn` for true HTTP-level cancellation.

---

## Phase 4 — `ChatbotPanel` Session Recovery ⭐ Medium Priority

**File to modify:** `components/shared/ChatbotPanel.tsx`  
**Depends on:** Phase 1  
**Can ship alone:** ✓

### What the current code does

```
useEffect:
  let isActive = true                        ← guard
  async startSession():
    check sessionStorage
    try getChatbotSession()
      if (!isActive) return                  ← guard ×1
      setChatSessionId(...)
      return
    catch:
      (fall through to create new session)
    try startChatbotSession()
      if (!isActive) return                  ← guard ×2
      setChatSessionId(...)
    catch:
      if (!isActive) return                  ← guard ×3
      setChatError(...)
    finally:
      if (!isActive) return                  ← guard ×4
      setIsChatLoading(false)
  return () => { isActive = false }          ← guard ×5
```

### Replacement

```ts
useEffect(() => {
  if (!documentId) return;

  const destroy$ = createDestroy$();
  setIsChatLoading(true);
  setChatError(null);

  defer(() => {
    const stored = sessionStorage.getItem(sessionKeyForDocument(documentId));

    if (stored) {
      return from(criminalReportsService.getChatbotSession(stored)).pipe(
        map((history) => ({ sessionId: stored, messages: history.messages })),
        catchError(() =>
          from(criminalReportsService.startChatbotSession({ documentId })).pipe(
            map((s) => ({ sessionId: s.sessionId, messages: [] })),
            tap((s) => sessionStorage.setItem(sessionKeyForDocument(documentId), s.sessionId)),
          ),
        ),
      );
    }

    return from(criminalReportsService.startChatbotSession({ documentId })).pipe(
      map((s) => ({ sessionId: s.sessionId, messages: [] })),
      tap((s) => sessionStorage.setItem(sessionKeyForDocument(documentId), s.sessionId)),
    );
  }).pipe(
    takeUntil(destroy$),
  ).subscribe({
    next:  ({ sessionId, messages }) => {
      setChatSessionId(sessionId);
      setChatMessages(messages);
      setIsChatLoading(false);
    },
    error: () => {
      setChatError('Failed to start chatbot session.');
      setIsChatLoading(false);
    },
  });

  return () => completeDestroy$(destroy$);
}, [documentId]);
```

### What is removed

- `let isActive = true`
- All five `if (!isActive) return` guards
- The nested `try/catch/finally` async chain
- `async startSession()` inner function

### What replaces them

- `takeUntil(destroy$)` — single cleanup point
- `catchError` — replaces the catch block fallback
- `defer` — ensures `sessionStorage.getItem` runs at subscription time, not at effect setup time

---

## Phase 5 — `authService` Token Init ⭐ Medium Priority

**File to modify:** `services/authService.ts`  
**Depends on:** Phase 0 only  
**Can ship alone:** ✓ (no shared utilities needed)

### What the current code does

```ts
// Lines 47-49
let keycloakInstance: Keycloak | null = null;
let keycloakInitialized = false;           // ← manual "has run" flag
let keycloakInitPromise: Promise<boolean> | null = null; // ← manual shareReplay(1)

// initKeycloak (lines 137-186):
// 1. if (keycloakInitialized) return stored result   ← early-return guard
// 2. if (!keycloakInitPromise) { ... }               ← singleton guard
// 3. return keycloakInitPromise                      ← shared promise
```

### Replacement

```ts
// Replace lines 47-49 with:
let keycloakInstance: Keycloak | null = null;
let keycloakInit$: Observable<boolean> | null = null;  // shareReplay(1) handles the rest

// initKeycloak:
initKeycloak: (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (!keycloakInit$) {
    const keycloak = getKeycloak();
    keycloakInit$ = defer(() => from(keycloak.init(initOptions))).pipe(
      tap((authenticated) => {
        if (authenticated) persistKeycloakAuth();
        else clearStoredAuth();
        registerTokenRefreshHandler(keycloak);
      }),
      shareReplay(1),
    );
  }

  return firstValueFrom(keycloakInit$);
},
```

### What is removed

- `keycloakInitialized` boolean (line 48)
- `keycloakInitPromise` (line 49)
- The manual `if (keycloakInitialized)` early-return guard
- The manual `if (!keycloakInitPromise)` singleton guard

### What replaces them

- `shareReplay(1)` — replays the last emitted value to any late subscriber without re-executing `defer`
- `firstValueFrom` — converts the observable back to a `Promise` so all callers (`await authService.initKeycloak()`) require zero changes

### SSR safety

The `typeof window === 'undefined'` guard on line 137 is preserved. `keycloakInit$` is `null` during SSR because `initKeycloak` returns early — `defer` never executes on the server.

---

## Phase 6 — `NotificationContext` ⭐ Low Priority

**File to modify:** `contexts/NotificationContext.tsx`  
**Depends on:** Phase 1  
**Can ship alone:** ✓

### What the current code does

```ts
// Three separate useCallback mutators, each calling setNotifications:
const addNotification    = useCallback((n) => setNotifications(prev => [...]), []);
const markAsRead         = useCallback((id) => setNotifications(prev => [...]), []);
const removeNotification = useCallback((id) => setNotifications(prev => [...]), []);
const clearAll           = useCallback(() => setNotifications([]), []);
```

The reducer logic is spread across four closures with no single source of truth.

### Replacement

**Step 1 — Extract a pure reducer** (new file or top of context file):

```ts
type NotificationAction =
  | { type: 'ADD';       payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_READ'; id: string }
  | { type: 'REMOVE';    id: string }
  | { type: 'CLEAR' };

function notificationReducer(
  state: Notification[],
  action: NotificationAction,
): Notification[] {
  switch (action.type) {
    case 'ADD':
      return [{
        ...action.payload,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        read: false,
      }, ...state];
    case 'MARK_READ':
      return state.map((n) => n.id === action.id ? { ...n, read: true } : n);
    case 'REMOVE':
      return state.filter((n) => n.id !== action.id);
    case 'CLEAR':
      return [];
  }
}
```

**Step 2 — Replace mutators with a single `Subject` + `scan`:**

```ts
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const action$ = useRef(new Subject<NotificationAction>()).current;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const sub = action$.pipe(scan(notificationReducer, [])).subscribe(setNotifications);
    return () => sub.unsubscribe();
  }, []); // action$ is a stable ref

  const addNotification = useCallback(
    (payload: Omit<Notification, 'id' | 'timestamp' | 'read'>) =>
      action$.next({ type: 'ADD', payload }),
    [action$],
  );
  const markAsRead         = useCallback((id: string) => action$.next({ type: 'MARK_READ', id }), [action$]);
  const removeNotification = useCallback((id: string) => action$.next({ type: 'REMOVE', id }), [action$]);
  const clearAll           = useCallback(() => action$.next({ type: 'CLEAR' }), [action$]);

  // ...rest of provider — context value shape is unchanged
}
```

### What is removed

- All four `setNotifications(prev => ...)` inline reducer patterns
- The logic spread across four closures

### What stays unchanged

- `NotificationContextType` interface
- All consumers of the context — the public API is identical
- `unreadCount` computed value (`notifications.filter(n => !n.read).length`)

### Benefit

`notificationReducer` is now a pure function. It can be unit-tested with zero mocks, zero React infrastructure.

---

## Phase 7 — Cleanup

**Depends on:** All features landed  
**Can ship alone:** ✓

- Remove `use-debounce` from `package.json` if no non-RxJS code still imports it
- Add `lib/**` and `hooks/**` to `collectCoverageFrom` in `jest.config.ts`
- Add new test files:

| Test file | What it tests |
|---|---|
| `hooks/__tests__/usePagedList.test.ts` | Debounce timing, `switchMap` cancellation, refresh trigger |
| `lib/__tests__/rxjs-helpers.test.ts` | `fromStompChannel` subscribe/unsubscribe lifecycle |
| `services/__tests__/authService.rxjs.test.ts` | `shareReplay(1)` deduplication (call `initKeycloak()` twice, assert `keycloak.init` called once) |
| `contexts/__tests__/notificationReducer.test.ts` | All four action types as pure function |

---

## Sequencing Summary

```
Phase 0  ──────────────────────────────────────────── pnpm add rxjs
Phase 1  ── lib/rxjs-helpers.ts · hooks/useObservable.ts
             │
             ├── Phase 2  EmergencyRequestRealtimeContext
             ├── Phase 3  usePagedList + 3 list pages  ─┐  (can run in parallel)
             ├── Phase 4  ChatbotPanel                  ─┤
             └── Phase 6  NotificationContext           ─┘

Phase 0 only ── Phase 5  authService (no shared utilities needed)

Phase 7  ── cleanup (after all features land)
```

**Total files changed:** 8 existing files modified, 3 new files created.  
**External dependency removed:** `use-debounce` (Phase 7, conditional).  
**External dependency added:** `rxjs` (Phase 0, pinned).  
**Zero breaking changes** to any public API or context shape.
