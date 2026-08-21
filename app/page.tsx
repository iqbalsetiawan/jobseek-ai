'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { CoverLetterForm } from '@/components/CoverLetterForm';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIsClient } from '@/hooks/useIsClient';
import {
  deleteFromHistory,
  getHistory,
  saveToHistory,
  type CoverLetterHistoryEntry,
  type CoverLetterTone,
} from '@/lib/history';

export default function Home() {
  const [coverLetter, setCoverLetter] = useState('');
  const [letterRunKey, setLetterRunKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [instantPreview, setInstantPreview] = useState(false);
  const [loadedDraft, setLoadedDraft] =
    useState<CoverLetterHistoryEntry | null>(null);
  const [currentMeta, setCurrentMeta] = useState<{
    role: string;
    company: string;
    jobDescription: string;
    requirements: string;
    tone: CoverLetterTone;
  } | null>(null);
  const [, forceHistoryRefresh] = useState(0);
  const isClient = useIsClient();
  const history = isClient ? getHistory() : [];

  function handleRegenerate() {
    (
      document.getElementById('cover-letter-form') as HTMLFormElement | null
    )?.requestSubmit();
  }

  function handleGenerate(
    letter: string,
    meta: {
      company: string;
      role: string;
      tone: CoverLetterTone;
      jobDescription: string;
      requirements: string;
      linkedin: string;
      includeLinkedin: boolean;
      email: string;
      includeEmail: boolean;
    },
  ) {
    setCoverLetter(letter);
    setLetterRunKey((k) => k + 1);
    setInstantPreview(false);
    setCurrentMeta({
      role: meta.role,
      company: meta.company,
      jobDescription: meta.jobDescription,
      requirements: meta.requirements,
      tone: meta.tone,
    });
    saveToHistory({ coverLetter: letter, ...meta });
    forceHistoryRefresh((v) => v + 1);
  }

  function handleSelectHistory(entry: CoverLetterHistoryEntry) {
    setCoverLetter(entry.coverLetter);
    setLetterRunKey((k) => k + 1);
    setInstantPreview(true);
    setLoadedDraft(entry);
    setCurrentMeta({
      role: entry.role,
      company: entry.company,
      jobDescription: entry.jobDescription,
      requirements: entry.requirements,
      tone: entry.tone,
    });
    setMobileNavOpen(false);
  }

  function handleDeleteHistory(id: string) {
    deleteFromHistory(id);
    forceHistoryRefresh((v) => v + 1);
  }

  return (
    <div className="bg-muted/40 dark:bg-muted/20 min-h-screen">
      {/* Mobile top bar */}
      <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-foreground truncate text-sm font-semibold tracking-tight">
          JobSeekAI
        </span>
        <ThemeToggle />
      </header>

      {/* Mobile nav drawer — narrow rail so main content stays mostly visible */}
      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default bg-black/50 dark:bg-black/60"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="border-border bg-background absolute inset-y-0 left-0 z-10 flex h-full w-[min(12.5rem,70vw)] flex-col border-r shadow-xl">
            <Sidebar
              onDrawerClose={() => setMobileNavOpen(false)}
              className="min-h-0 flex-1"
              historyEntries={history}
              onSelectHistory={handleSelectHistory}
              onDeleteHistory={handleDeleteHistory}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:flex-row lg:items-start">
        {/* Desktop sidebar */}
        <div className="hidden shrink-0 lg:block lg:w-60">
          <div className="sticky top-6 max-h-[calc(100dvh-3rem)]">
            <Sidebar
              historyEntries={history}
              onSelectHistory={handleSelectHistory}
              onDeleteHistory={handleDeleteHistory}
            />
          </div>
        </div>

        {/* Form + preview */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6 xl:gap-6">
          <div className="border-border bg-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm lg:h-[calc(100dvh-3rem)]">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              <div className="mb-5 sm:mb-6">
                <h1 className="text-foreground text-base font-semibold sm:text-lg">
                  Cover letter that sounds like you
                </h1>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                  Share the basics about the role and what matters to the
                  employer. You will get text you can refine, clear and human,
                  not boilerplate.
                </p>
              </div>
              <CoverLetterForm
                onGenerate={handleGenerate}
                onGenerating={setIsGenerating}
                isGenerating={isGenerating}
                draft={loadedDraft}
              />
            </div>
          </div>

          <div className="border-border bg-card flex min-h-[min(50vh,28rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm lg:h-[calc(100dvh-3rem)]">
            <PreviewPanel
              coverLetter={coverLetter}
              letterRunKey={letterRunKey}
              isGenerating={isGenerating}
              onRegenerate={handleRegenerate}
              onCoverLetterChange={setCoverLetter}
              instant={instantPreview}
              meta={currentMeta}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
