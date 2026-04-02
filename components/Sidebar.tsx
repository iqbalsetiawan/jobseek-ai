'use client';

import { FileText, Sparkles, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  activeTab: 'cover-letter' | 'improve-cv';
  onTabChange: (tab: 'cover-letter' | 'improve-cv') => void;
}

const navItems = [
  {
    id: 'cover-letter' as const,
    label: 'Cover Letter',
    icon: FileText,
  },
  {
    id: 'improve-cv' as const,
    label: 'Improve My CV',
    icon: FileEdit,
    disabled: true,
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-white dark:bg-gray-900 border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
          <Sparkles className="h-4 w-4 text-background" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          jobseekAI
        </span>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Tools
        </p>
        {navItems.map(({ id, label, icon: Icon, disabled }) => (
          <button
            key={id}
            onClick={() => !disabled && onTabChange(id)}
            disabled={disabled}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-gray-100 dark:bg-gray-800 text-foreground'
                : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-foreground',
              disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {disabled && (
              <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                Soon
              </span>
            )}
          </button>
        ))}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[11px] text-muted-foreground">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
