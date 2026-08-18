'use client';

import Image from 'next/image';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { CoverLetterHistoryEntry } from '@/lib/history';

interface SidebarProps {
  className?: string;
  onDrawerClose?: () => void;
  historyEntries?: CoverLetterHistoryEntry[];
  onSelectHistory?: (entry: CoverLetterHistoryEntry) => void;
  onDeleteHistory?: (id: string) => void;
}

function formatHistoryDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function Sidebar({
  className,
  onDrawerClose,
  historyEntries = [],
  onSelectHistory,
  onDeleteHistory,
}: SidebarProps) {
  const isDrawer = Boolean(onDrawerClose);

  return (
    <aside
      className={cn(
        'border-border bg-background flex h-full flex-col overflow-hidden rounded-xl border shadow-sm',
        isDrawer
          ? 'w-full max-w-none min-w-0 rounded-none border-0 shadow-none'
          : 'w-full max-w-60 min-w-60',
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
            <div className="bg-foreground flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <Image
                src="/logo-triangle-white.png"
                alt=""
                width={16}
                height={16}
                className="dark:invert"
              />
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

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-muted-foreground text-[11px]">Saved draft</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {historyEntries.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-xs">
              Generated letters will be saved here.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {historyEntries.map((entry) => (
                <li key={entry.id} className="group/item relative">
                  <button
                    type="button"
                    onClick={() => onSelectHistory?.(entry)}
                    className="hover:bg-muted flex w-full min-w-0 flex-col items-start gap-0.5 rounded-lg px-2 py-2 pr-8 text-left transition-colors"
                  >
                    <span className="text-foreground w-full truncate text-xs font-medium">
                      {entry.role} · {entry.company}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {formatHistoryDate(entry.createdAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteHistory?.(entry.id)}
                    className="text-muted-foreground hover:bg-muted hover:text-destructive absolute top-1.5 right-1.5 rounded-md p-1.5 opacity-60 transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100"
                    aria-label={`Delete ${entry.role} at ${entry.company}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-muted-foreground text-[11px]">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
