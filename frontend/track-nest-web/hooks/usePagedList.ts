"use client";

import { useRef, useState, useEffect } from "react";
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  from,
  EMPTY,
} from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  take,
} from "rxjs/operators";

export interface PagedListParams {
  page: number;
  size: number;
  searchTitle: string;
  /** Generic filter token — page maps this to status/severity/etc. */
  tab: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

export interface UsePagedListResult<T> {
  items: T[];
  totalPages: number;
  totalElements: number;
  isLoading: boolean;
  currentPage: number;
  /** Current raw search string — useful for UI that keys on it (e.g. "featured" logic). */
  searchValue: string;
  setSearch: (value: string) => void;
  setTab: (value: string) => void;
  setPage: (value: number) => void;
  refresh: () => void;
}

/**
 * Shared hook for paginated, searchable, filterable lists.
 *
 * - Debounces search input (400 ms) via BehaviorSubject.
 * - Auto-cancels in-flight fetches on param changes via switchMap.
 * - Replaces: useDebouncedCallback, let cancelled = false, refreshKey state.
 *
 * @param fetchFn  Async fetch function — receives current params, returns paged data.
 * @param initialTab  Initial value for the tab/filter BehaviorSubject.
 * @param initialPage  Starting page (default 0).
 * @param size  Page size (default 10).
 * @param enabled  Set to false to suppress fetching (e.g. while user is loading).
 */
export function usePagedList<T>(
  fetchFn: (params: PagedListParams) => Promise<PagedResponse<T>>,
  initialTab = "",
  initialPage = 0,
  size = 10,
  enabled = true,
): UsePagedListResult<T> {
  // Stable refs — survive re-renders and Strict Mode remounts
  const search$  = useRef(new BehaviorSubject("")).current;
  const tab$     = useRef(new BehaviorSubject(initialTab)).current;
  const page$    = useRef(new BehaviorSubject(initialPage)).current;
  const refresh$ = useRef(new Subject<void>()).current;

  const [items, setItems]                   = useState<T[]>([]);
  const [totalPages, setTotalPages]         = useState(0);
  const [totalElements, setTotalElements]   = useState(0);
  const [isLoading, setIsLoading]           = useState(true);
  const [currentPage, setCurrentPage]       = useState(initialPage);
  const [searchValue, setSearchValue]       = useState("");

  useEffect(() => {
    if (!enabled) return;

    // Debounce only the search; tab and page changes are immediate
    const debounced$ = search$.pipe(debounceTime(400), distinctUntilChanged());

    const params$ = combineLatest([debounced$, tab$, page$]).pipe(
      // Avoid duplicate emissions when multiple subjects emit at the same tick
      distinctUntilChanged(
        (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2],
      ),
    );

    const subscription = params$
      .pipe(
        switchMap(([searchTitle, tab, page]) => {
          setIsLoading(true);
          return from(fetchFn({ page, size, searchTitle, tab })).pipe(
            catchError(() => {
              setIsLoading(false);
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe((response) => {
        setItems(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setIsLoading(false);
      });

    // refresh$ re-fetches current params on demand (e.g. after a delete)
    const refreshSub = refresh$
      .pipe(
        switchMap(() =>
          params$.pipe(
            take(1),
            switchMap(([searchTitle, tab, page]) =>
              from(fetchFn({ page, size, searchTitle, tab })).pipe(
                catchError(() => EMPTY),
              ),
            ),
          ),
        ),
      )
      .subscribe((response) => {
        setItems(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      });

    return () => {
      subscription.unsubscribe();
      refreshSub.unsubscribe();
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  // Subjects are stable refs — they must NOT be in the dep array or a new
  // pipeline is created on every render, causing infinite loops.

  return {
    items,
    totalPages,
    totalElements,
    isLoading,
    currentPage,
    searchValue,
    setSearch: (v: string) => {
      setSearchValue(v);
      search$.next(v);
    },
    setTab: (v: string) => {
      tab$.next(v);
      page$.next(0);
      setCurrentPage(0);
    },
    setPage: (v: number) => {
      page$.next(v);
      setCurrentPage(v);
    },
    refresh: () => refresh$.next(),
  };
}
