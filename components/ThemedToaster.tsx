'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { useIsClient } from '@/hooks/useIsClient';

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const mounted = useIsClient();

  return (
    <Toaster
      richColors
      position="bottom-right"
      theme={
        mounted && resolvedTheme === 'dark'
          ? 'dark'
          : mounted && resolvedTheme === 'light'
            ? 'light'
            : 'system'
      }
    />
  );
}
