'use client';

import { useSyncExternalStore } from 'react';

/** True after client hydration; false on server (avoids theme flash / hydration mismatch). */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
