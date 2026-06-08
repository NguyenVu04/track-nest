# Vai trò của RxJS trong `track-nest-web` & Hướng chuyển đổi không dùng RxJS

> Mục đích: tổng hợp **toàn bộ chỗ đang dùng `rxjs`** trong frontend, mô tả vai trò thực tế của từng đoạn code, các tính năng phụ thuộc vào chúng, và đề xuất cách viết lại nếu muốn loại bỏ RxJS khỏi codebase.

---

## 1. Tổng quan

- Phiên bản: `rxjs@7.8.2` (khai báo trong `package.json`).
- Số file *chính thức* import từ `rxjs` / `rxjs/operators`: **6 file**.
- Trong đó:
  - 1 file hạ tầng dùng chung: `lib/rxjs-helpers.ts`
  - 1 file hook adapter sẵn nhưng chưa có consumer: `hooks/useObservable.ts`
  - 4 file feature thực sự dùng: `services/authService.ts`, `hooks/usePagedList.ts`, `contexts/EmergencyRequestRealtimeContext.tsx`, `contexts/NotificationContext.tsx`, `components/shared/ChatbotPanel.tsx`
- Có 1 file STOMP (`contexts/ReportRealtimeContext.tsx`) chủ động **không** dùng RxJS, vẫn callback thuần.
- Tài liệu kế hoạch tích hợp: `RXJS_INTEGRATION_PLAN.md` (đã thực hiện một phần — đa số các phase đã xong, Phase 7 cleanup chưa).

Tỷ trọng tổng thể: **trung bình**. RxJS chạm vào ba luồng quan trọng (auth init, WebSocket lifecycle, notification queue + paged list), nhưng chỉ tập trung ở < 10 file. Việc loại bỏ là khả thi cho **mọi** vị trí, một số chỗ tốn công hơn các chỗ khác.

---

## 2. Bản đồ chi tiết vai trò của RxJS

### 2.1. `lib/rxjs-helpers.ts` — lớp hạ tầng

```ts
import { Subject, Observable, fromEventPattern } from "rxjs";

export function createDestroy$(): Subject<void> { return new Subject<void>(); }
export function completeDestroy$(s: Subject<void>): void { s.next(); s.complete(); }
export function fromStompChannel(destination: string): Observable<IMessage> {
  return fromEventPattern<IMessage>(
    (handler) => stompService.subscribe(destination, handler),
    (_, sub) => sub?.unsubscribe(),
  );
}
```

**Vai trò:** ba helper tái sử dụng — pattern `destroy$` thay cho cờ `let isActive = true`, và `fromStompChannel` biến callback STOMP thành cold Observable để có thể `.pipe(takeUntil, switchMap, ...)`.

**Tính năng phụ thuộc:** mọi nơi dùng STOMP qua RxJS (`EmergencyRequestRealtimeContext`, `ChatbotPanel`).

### 2.2. `services/authService.ts` — khởi tạo Keycloak một lần (`shareReplay`)

```ts
keycloakInit$ = defer(() => from(keycloak.init(initOptions))).pipe(
  tap((authenticated) => { /* persist or clear */ }),
  shareReplay(1),
);
return firstValueFrom(keycloakInit$);
```

**Vai trò:** thay cờ tay `keycloakInitialized` + biến `keycloakInitPromise` bằng `shareReplay(1)`. Lần gọi đầu tiên kích hoạt `keycloak.init()`; mọi caller sau nhận lại kết quả đã cache. `defer` đảm bảo lazy — an toàn cho SSR (không chạy ở thời điểm import).

**Tính năng phụ thuộc:** `AuthContext` (toàn bộ auth flow → mọi trang protected).

### 2.3. `hooks/usePagedList.ts` — search debounce + cancel in-flight

```ts
import { BehaviorSubject, Subject, combineLatest, from, EMPTY } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap, catchError } from "rxjs/operators";

const debounced$ = search$.pipe(debounceTime(400), distinctUntilChanged());
const params$ = combineLatest([debounced$, tab$, page$]).pipe(distinctUntilChanged(...));
params$.pipe(
  switchMap(([q, tab, page]) =>
    from(fetchFn({ page, size, searchTitle: q, tab })).pipe(catchError(() => EMPTY)),
  ),
).subscribe((response) => { /* setItems, setTotalPages */ });
```

**Vai trò:** gom việc debounce 400 ms, theo dõi 3 input (search, tab, page) qua `combineLatest`, và đặc biệt là `switchMap` để **tự huỷ request cũ** mỗi khi tham số đổi — không còn race "kết quả request cũ về sau, ghi đè kết quả request mới".

**Tính năng phụ thuộc:**
- `app/dashboard/missing-persons/page.tsx`
- `app/dashboard/crime-reports/page.tsx`
- `app/dashboard/guidelines/page.tsx`

### 2.4. `contexts/EmergencyRequestRealtimeContext.tsx` — WebSocket lifecycle

```ts
const connect$ = defer(() => from(stompService.connect(token)));
connect$.pipe(
  switchMap(() => fromStompChannel("/user/queue/emergency-request")),
  takeUntil(destroy$),
).subscribe({ next: handleEmergency, error: log });
connect$.pipe(
  switchMap(() => fromStompChannel("/user/queue/user-location")),
  takeUntil(destroy$),
).subscribe({ next: handleLocation, error: log });
```

**Vai trò:** chuỗi `connect → subscribe` 2 kênh song song chia sẻ chung một tín hiệu huỷ (`destroy$`). Khi component unmount, `completeDestroy$` chạy một lần và cả 2 subscription tự dọn.

**Tính năng phụ thuộc:**
- Realtime assignment cho Emergency Service (`/user/queue/emergency-request`)
- Realtime location feed (`/user/queue/user-location`)
- Realtime trạng thái cho Reporter (`/user/queue/emergency-request-status`)
- Người dùng cuối: hook `useEmergencyRequestRealtime` ở `/dashboard/emergency-requests/*`.

### 2.5. `contexts/NotificationContext.tsx` — hàng đợi notification

```ts
const action$ = useRef(new Subject<NotificationAction>()).current;
useEffect(() => {
  const sub = action$.pipe(scan(notificationReducer, [])).subscribe(setNotifications);
  return () => sub.unsubscribe();
}, []);
const addNotification = useCallback((p) => action$.next({ type: "ADD", payload: p }), []);
```

**Vai trò:** dùng `Subject` + `scan` như một reducer — mọi mutator (`add`, `markRead`, `remove`, `clear`) đẩy action qua `action$`, hàm thuần `notificationReducer` tích luỹ state. Public API (`addNotification`, etc.) giữ nguyên.

**Tính năng phụ thuộc:** mọi toast/notification trên dashboard — gọi từ `EmergencyRequestRealtimeContext`, `ReportRealtimeContext`, các trang list (sau khi xoá/sửa), `ChatbotPanel`.

### 2.6. `components/shared/ChatbotPanel.tsx` — khởi tạo session có fallback

```ts
defer(() => {
  const stored = sessionStorage.getItem(key);
  if (stored) {
    return from(getChatbotSession(stored)).pipe(
      map((h) => ({ sessionId: stored, messages: h.messages })),
      catchError(() => from(startChatbotSession({ documentId })).pipe(map(...), tap(saveSession))),
    );
  }
  return from(startChatbotSession({ documentId })).pipe(map(...), tap(saveSession));
}).pipe(takeUntil(destroy$)).subscribe({ next, error });
```

**Vai trò:** thử lấy session cũ → nếu lỗi thì tự rớt sang luồng tạo session mới qua `catchError`. `defer` để chỉ chạm `sessionStorage` ở client. `takeUntil(destroy$)` thay 5 cờ `if (!isActive) return` rải rác trước đây.

**Tính năng phụ thuộc:** AI chatbot panel ở trang chi tiết Crime Report.

### 2.7. `hooks/useObservable.ts` — adapter Observable → React state

```ts
import type { Observable } from "rxjs";
useEffect(() => {
  const sub = source$.subscribe({ next: (v) => setState({ value: v, ... }), error: ... });
  return () => sub.unsubscribe();
}, [source$]);
```

**Vai trò:** chuẩn bị sẵn để consume bất kỳ `Observable<T>` nào trong component. Hiện **chưa có consumer thực tế** — đang ở trạng thái plan.

### 2.8. `contexts/ReportRealtimeContext.tsx` — ngược lại, KHÔNG dùng RxJS

```ts
client.onConnect = () => {
  Object.entries(TOPIC_MAP).forEach(([reportType, topic]) => {
    client.subscribe(topic, (msg) => { addNotification(...) });
  });
};
```

Cho thấy **không phải mọi STOMP context đều cần RxJS** — file này tự xử lý callback và vẫn chạy ổn. Đây là một chỉ dấu: nếu chỉ cần 1 client subscribe nhiều topic mà không có chuỗi xử lý phức tạp, có thể bỏ RxJS không tốn công.

---

## 3. Ảnh hưởng của RxJS đến các chức năng

| Luồng | Vai trò RxJS | Hệ quả nếu RxJS hỏng / xoá sai |
|------|--------------|-------------------------------|
| Khởi tạo Keycloak | Cache kết quả `init()` cho mọi consumer | Init chạy nhiều lần → đăng nhập chớp đôi, race condition khi nhiều page mount cùng lúc |
| WebSocket emergency notification | Connect 1 lần + chia 2 subscription, dọn chung một tín hiệu | Memory leak khi unmount, hoặc subscribe trước khi CONNECTED → mất message đầu |
| Notification queue | Đẩy action vào `Subject`, `scan` tích luỹ | Toast không xuất hiện hoặc cập nhật sai (nếu reducer sai); ảnh hưởng tất cả trang dùng `addNotification` |
| Danh sách (paged + search) | Debounce + auto-cancel request cũ | Trang list bị flicker do response cũ ghi đè response mới (cảm giác "kết quả nhảy lung tung") |
| Chatbot session | Try cũ → fallback tạo mới | Vào lại tab cũ không nhớ phiên, hoặc lỗi mạng làm panel mãi loading |
| Auth context khởi tạo | `firstValueFrom(init$)` | Mọi page protected đợi promise này; nếu logic sai thì middleware/guard fail |

Một số điểm hiện đang được RxJS che lấp (đã trình bày ở `WEBSOCKET_NOTIFICATION_ISSUES.md`):

- `defer(() => from(stompService.connect(token)))` vẫn capture token đã hết hạn trong closure — RxJS không tự giải quyết hộ.
- `fromStompChannel` gọi `stompService.subscribe(...)` ngay sau `connect`, có race nhỏ với CONNECTED frame.

Tức là RxJS **giúp gọn code**, nhưng nó **không** sửa các lỗi nghiệp vụ; cần chú ý khi đánh giá lợi ích.

---

## 4. Đề xuất chuyển đổi không dùng RxJS

Phần này liệt kê tương ứng 1–1 cho từng construct, kèm độ khó.

### 4.1. Bảng tra cứu nhanh

| RxJS construct | Vị trí dùng | Thay thế không-RxJS | Độ khó |
|----------------|------------|---------------------|--------|
| `shareReplay(1)` (cache init) | `authService` | Module-level `let initPromise: Promise<...> \| null` | Thấp |
| `defer + from(promise)` | `authService`, `ChatbotPanel` | Gọi async/await thẳng trong `useEffect` | Thấp |
| `firstValueFrom` | `authService` | Bỏ luôn — trả promise trực tiếp | Thấp |
| `Subject<void>` (destroy$) | `Emergency...Context`, `ChatbotPanel` | `AbortController` hoặc `let cancelled = false` | Thấp |
| `Subject<T>` + `scan` (reducer) | `NotificationContext` | `useReducer` | Thấp |
| `fromEventPattern` (STOMP wrapper) | `rxjs-helpers` | Hàm `subscribe(dest, cb)` trả `() => unsubscribe()` | Thấp |
| `takeUntil(destroy$)` | nhiều file | Kiểm tra `signal.aborted` / `cancelled` trong callback rồi unsubscribe thủ công | Trung bình |
| `switchMap` chain (connect → subscribe) | `Emergency...Context` | `await connect; if (!cancelled) subscribe(...)` | Trung bình |
| `debounceTime` + `distinctUntilChanged` | `usePagedList` | Custom hook `useDebouncedValue` + so sánh thủ công | Thấp |
| `combineLatest` (3 nguồn) | `usePagedList` | `useEffect` với deps = [a, b, c] | Trung bình |
| `switchMap` cancel request | `usePagedList` | `AbortController.signal` chuyền vào `fetch` | Trung bình – Cao |
| `catchError` rẽ nhánh | `ChatbotPanel` | `try/catch` lồng | Thấp |
| `BehaviorSubject<T>` | `usePagedList` | `useState<T>` (vì chỉ có 1 component đọc) | Thấp |
| `Observable<T>` adapter (`useObservable`) | hook chưa dùng | Xoá hook — không cần thay | Thấp |

### 4.2. Mẫu rewrite cụ thể cho từng điểm

#### a) `authService.initKeycloak` — bỏ `shareReplay/defer/firstValueFrom`

```ts
let initPromise: Promise<boolean> | null = null;

export const authService = {
  initKeycloak(options?: Partial<KeycloakInitOptions>): Promise<boolean> {
    if (typeof window === "undefined") return Promise.resolve(false);
    if (initPromise) return initPromise;
    const keycloak = getKeycloak();
    initPromise = keycloak.init({ onLoad: "check-sso", checkLoginIframe: false, ...options })
      .then((authenticated) => {
        if (authenticated) persistKeycloakAuth(); else clearStoredAuth();
        keycloak.onTokenExpired = async () => { /* unchanged */ };
        return authenticated;
      })
      .catch((err) => { initPromise = null; throw err; });
    return initPromise;
  },
};
```

Lợi ích: bớt 3 import RxJS, hành vi tương đương.

#### b) `NotificationContext` — `Subject` + `scan` → `useReducer`

```ts
type Action =
  | { type: "ADD"; payload: Omit<Notification, "id" | "timestamp" | "read"> }
  | { type: "READ"; id: string }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" };

function reducer(state: Notification[], action: Action): Notification[] {
  switch (action.type) {
    case "ADD":    return [{ ...action.payload, id: uuid(), timestamp: Date.now(), read: false }, ...state];
    case "READ":   return state.map(n => n.id === action.id ? { ...n, read: true } : n);
    case "REMOVE": return state.filter(n => n.id !== action.id);
    case "CLEAR":  return [];
  }
}

const [notifications, dispatch] = useReducer(reducer, []);
const addNotification = useCallback((p) => dispatch({ type: "ADD", payload: p }), []);
```

Tương đương 1–1, không còn `Subject` & `scan`.

#### c) `EmergencyRequestRealtimeContext` — `defer/switchMap/takeUntil` → async + AbortController

```ts
useEffect(() => {
  if (!user) return;
  const ac = new AbortController();
  const subs: Array<{ unsubscribe(): void } | null> = [];

  (async () => {
    try {
      const token = authService.getAccessToken();
      if (!token || ac.signal.aborted) return;
      await stompService.connect(token);
      if (ac.signal.aborted) return;

      if (user.role?.includes("Emergency Service")) {
        subs.push(stompService.subscribe("/user/queue/emergency-request", handleEmergency));
        subs.push(stompService.subscribe("/user/queue/user-location", handleLocation));
      } else {
        subs.push(stompService.subscribe("/user/queue/emergency-request-status", handleStatus));
      }
    } catch (err) { console.error("[STOMP] connect failed", err); }
  })();

  return () => {
    ac.abort();
    subs.forEach(s => s?.unsubscribe());
    stompService.disconnect();
  };
}, [user, addNotification]);
```

Mất tính khai báo, nhưng vẫn ngắn và dễ debug.

#### d) `usePagedList` — phần khó nhất

Nếu vẫn muốn có `debounce` + `cancel`:

```ts
const [search, setSearch] = useState("");
const [tab, setTab] = useState<string | null>(null);
const [page, setPage] = useState(1);
const [items, setItems] = useState<T[]>([]);
const [isLoading, setIsLoading] = useState(false);

const debouncedSearch = useDebouncedValue(search, 400); // hook tự viết hoặc dùng use-debounce

useEffect(() => {
  const ac = new AbortController();
  setIsLoading(true);
  fetchFn({ page, size, searchTitle: debouncedSearch, tab, signal: ac.signal })
    .then((resp) => {
      if (ac.signal.aborted) return;
      setItems(resp.content);
      setTotalPages(resp.totalPages);
      setTotalElements(resp.totalElements);
    })
    .catch((err) => { if (!ac.signal.aborted) setError(err); })
    .finally(() => { if (!ac.signal.aborted) setIsLoading(false); });
  return () => ac.abort();
}, [debouncedSearch, tab, page, refreshKey]);
```

Yêu cầu `fetchFn` chịu nhận `signal` (axios hoặc fetch native đều hỗ trợ). Đây là điểm **cần sửa rộng nhất** nếu loại RxJS — vì hiện tại 3 trang list đều phụ thuộc.

#### e) `ChatbotPanel` — `defer/catchError` → try/catch

```ts
useEffect(() => {
  let cancelled = false;
  (async () => {
    const stored = sessionStorage.getItem(sessionKeyForDocument(documentId));
    try {
      if (stored) {
        try {
          const h = await criminalReportsService.getChatbotSession(stored);
          if (!cancelled) { setChatSessionId(stored); setChatMessages(h.messages); }
        } catch {
          const s = await criminalReportsService.startChatbotSession({ documentId });
          if (!cancelled) {
            sessionStorage.setItem(sessionKeyForDocument(documentId), s.sessionId);
            setChatSessionId(s.sessionId); setChatMessages([]);
          }
        }
      } else {
        const s = await criminalReportsService.startChatbotSession({ documentId });
        if (!cancelled) {
          sessionStorage.setItem(sessionKeyForDocument(documentId), s.sessionId);
          setChatSessionId(s.sessionId); setChatMessages([]);
        }
      }
    } catch {
      if (!cancelled) setChatError("Failed to start chatbot session.");
    } finally {
      if (!cancelled) setIsChatLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, [documentId]);
```

#### f) `lib/rxjs-helpers.ts` — bỏ luôn, đổi API STOMP

```ts
// services/stompService.ts
subscribe(dest: string, cb: (m: IMessage) => void): { unsubscribe(): void } | null {
  if (!client?.connected) return null;
  return client.subscribe(dest, cb);
}
```

Caller dùng trực tiếp `stompService.subscribe(...)`, không cần `fromStompChannel`.

#### g) `hooks/useObservable.ts` — xoá vì chưa có consumer.

---

## 5. Lộ trình đề xuất nếu muốn loại bỏ RxJS

Theo thứ tự độ rủi ro tăng dần:

1. **Xoá `hooks/useObservable.ts`** — không ai dùng, an toàn tuyệt đối.
2. **`NotificationContext` → `useReducer`** — 1:1, không đổi public API.
3. **`authService.initKeycloak`** → module-level cached promise.
4. **`ChatbotPanel`** → try/catch lồng.
5. **`EmergencyRequestRealtimeContext`** → async + AbortController + manual subscription list. Đồng thời sửa `stompService` để trả `{ unsubscribe }` cho subscribe.
6. **Xoá `lib/rxjs-helpers.ts`** sau khi 4 & 5 đã chuyển xong.
7. **`usePagedList`** — chuyển cuối cùng, cần thêm hook debounce + chỉnh các Service API để nhận `AbortSignal`. Test kỹ 3 trang list.
8. **Gỡ `rxjs` khỏi `package.json`** + chạy `npm run build` để bắt import sót.

Sau bước 8, có thể tháo luôn `RXJS_INTEGRATION_PLAN.md` (không còn phù hợp) và cập nhật CLAUDE.md.

---

## 6. Có nên loại bỏ RxJS hay không?

Quan điểm gợi ý (không phải mệnh lệnh):

**Giữ lại nếu:**
- Sắp thêm nhiều luồng realtime / search phức tạp (paged list khác, live dashboards…). `switchMap` và `combineLatest` ngắn gọn hơn đáng kể so với tự viết.
- Team đã quen RxJS — chi phí học/duy trì không đáng kể.
- Cần độ chính xác cao cho hủy request (auto-cancel) — RxJS làm việc này gần như "miễn phí".

**Nên loại bỏ nếu:**
- Bundle size là yếu tố cân nhắc (RxJS ~30KB gzipped, tree-shaking khá tốt nhưng không hoàn toàn).
- Đa số dev mới gặp khó khăn debug observable chain (stack trace dài, lazy evaluation gây bất ngờ).
- Phần realtime sắp chuyển sang Server-Sent Events / fetch streaming — khi đó RxJS overkill.
- Muốn đồng nhất pattern với `ReportRealtimeContext` (đang viết callback thuần).

---

## 7. Tóm tắt

- RxJS hiện chỉ chạm 6 file, tập trung vào ba luồng quan trọng: auth init, WebSocket lifecycle, notification + paged list.
- Mọi construct đang dùng đều có thay thế bằng React thuần (state, useReducer, useEffect, AbortController) và pattern callback truyền thống.
- Việc loại bỏ là khả thi, ước tính ~1–2 ngày nếu bao gồm test thủ công 3 trang list và 2 channel STOMP.
- File `WEBSOCKET_NOTIFICATION_ISSUES.md` nên đọc song song: nó liệt kê các lỗi *vẫn còn* dù dùng RxJS — chứng minh RxJS không phải nguyên nhân của các bug realtime hiện tại.
