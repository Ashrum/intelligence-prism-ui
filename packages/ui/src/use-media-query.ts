"use client";

import { useCallback, useSyncExternalStore } from "react";

const breakpoints = new Map([
  ["sm", 640], ["md", 800], ["lg", 1024], ["xl", 1280],
  ["2xl", 1536], ["3xl", 1600], ["4xl", 2000],
]);

export function useMediaQuery(query: string) {
  const max = query.startsWith("max-");
  const px = breakpoints.get(max ? query.slice(4) : query);
  const mediaQuery = px === undefined
    ? query
    : max ? `(max-width: ${px - 1}px)` : `(min-width: ${px}px)`;
  const subscribe = useCallback((notify: () => void) => {
    const list = window.matchMedia(mediaQuery);
    list.addEventListener("change", notify);
    return () => list.removeEventListener("change", notify);
  }, [mediaQuery]);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(mediaQuery).matches,
    () => false,
  );
}
