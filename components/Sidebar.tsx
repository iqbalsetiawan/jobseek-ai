'use client';

import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  className?: string;
  onDrawerClose?: () => void;
}

export function Sidebar({ className, onDrawerClose }: SidebarProps) {
  const isDrawer = Boolean(onDrawerClose);

  return (
    <aside
      className={cn(
        'border-border bg-background flex h-full flex-col overflow-hidden rounded-xl border shadow-sm',
        isDrawer
          ? 'w-full max-w-none min-w-0 rounded-none border-0 shadow-none'
          : 'w-full max-w-[240px] min-w-[240px]',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          isDrawer
            ? 'border-border justify-between border-b px-3 py-3.5'
            : 'px-4 py-5',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <div className="bg-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
              <Sparkles className="text-background h-4 w-4" />
            </div>
            <span className="text-foreground truncate text-sm font-semibold tracking-tight">
              JobSeekAI
            </span>
          </div>
          <p className="text-muted-foreground pl-9 text-[11px]">
            Cover letters
          </p>
        </div>
        {onDrawerClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 self-start"
            onClick={onDrawerClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {!isDrawer ? <Separator /> : null}

      <div className="flex flex-1 flex-col justify-end">
        <Separator />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-muted-foreground text-[11px]">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
