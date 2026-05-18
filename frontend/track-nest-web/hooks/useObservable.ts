"use client";

import { useState, useEffect } from "react";
import type { Observable } from "rxjs";

interface ObservableState<T> {
  value: T | undefined;
  error: unknown;
  isLoading: boolean;
}

/**
 * React/RxJS boundary adapter.
 * Subscribes to an Observable inside a useEffect, pushes emitted values into
 * useState, and unsubscribes on unmount.
 *
 * IMPORTANT: Callers must stabilise the source$ reference with useMemo or
 * useRef — otherwise the effect re-subscribes on every render.
 */
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
      next: (value) =>
        setState({ value, error: undefined, isLoading: false }),
      error: (error) =>
        setState((s) => ({ ...s, error, isLoading: false })),
    });
    return () => subscription.unsubscribe();
  }, [source$]);

  return state;
}
