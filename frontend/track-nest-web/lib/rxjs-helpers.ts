import { Subject, Observable, fromEventPattern } from "rxjs";
import type { IMessage } from "@stomp/stompjs";
import type { ManagedStompService } from "@/services/stompService";

/** Creates a Subject that signals component teardown. */
export function createDestroy$(): Subject<void> {
  return new Subject<void>();
}

/**
 * Completes a destroy subject — call this inside a useEffect cleanup function.
 * Emits once so takeUntil unsubscribes, then completes the subject itself.
 */
export function completeDestroy$(subject: Subject<void>): void {
  subject.next();
  subject.complete();
}

/**
 * Wraps a STOMP destination into an Observable<IMessage>.
 *
 * The managed STOMP service handles auto-connect + queueing internally, so
 * callers do not need to await connect() first. Each Observable subscriber
 * causes exactly one STOMP subscription; teardown unsubscribes cleanly.
 */
export function fromStompChannel(
  service: ManagedStompService,
  destination: string,
): Observable<IMessage> {
  return fromEventPattern<IMessage>(
    (handler) => service.subscribe(destination, handler as (m: IMessage) => void),
    (_, sub: { unsubscribe: () => void }) => sub?.unsubscribe(),
  );
}
