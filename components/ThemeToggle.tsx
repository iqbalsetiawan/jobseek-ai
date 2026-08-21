'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useIsClient } from '@/hooks/useIsClient';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useIsClient();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const rotate = prefersReducedMotion ? 0 : 90;
  const scale = prefersReducedMotion ? 1 : 0.9;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 overflow-hidden"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -rotate, scale }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate, scale }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="flex"
        >
          {isDark ? (
            <Sun className="text-muted-foreground h-4 w-4" />
          ) : (
            <Moon className="text-muted-foreground h-4 w-4" />
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
