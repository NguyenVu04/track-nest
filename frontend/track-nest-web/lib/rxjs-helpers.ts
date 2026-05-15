import { Subject, Observable, fromEventPattern } from "rxjs";
import type { IMessage } from "@stomp/stompjs";
import stompService from "@/services/stompService";

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
 * Calls stompService.subscribe on subscribe and unsubscribes on teardown.
 * Must be used after stompService.connect() has resolved.
 */
export function fromStompChannel(destination: string): Observable<IMessage> {
  return fromEventPattern<IMessage>(
    (handler) => stompService.subscribe(destination, handler),
    (_, sub: ReturnType<typeof stompService.subscribe>) => sub?.unsubscribe(),
  );
}
