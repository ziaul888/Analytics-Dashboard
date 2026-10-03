"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `callback` plus a `cancel` function.
 * The returned functions are referentially stable (only change with `delayMs`),
 * so they are safe to pass to memoised children or use as effect deps.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delayMs: number,
): readonly [run: (...args: A) => void, cancel: () => void] {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Never fire after unmount.
  useEffect(() => cancel, [cancel]);

  const run = useCallback(
    (...args: A) => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
      }, delayMs);
    },
    [cancel, delayMs],
  );

  return [run, cancel] as const;
}
