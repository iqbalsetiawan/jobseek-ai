'use client';

import { useEffect, useState } from 'react';
import { Copy, FileText, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import type { CoverLetterTone } from '@/lib/coverLetter';

interface PreviewPanelMeta {
  role: string;
  company: string;
  jobDescription: string;
  requirements: string;
  tone: CoverLetterTone;
}

interface PreviewPanelProps {
  coverLetter: string;
  /** Increments only when a new letter is generated (not when the user edits). */
  letterRunKey: number;
  isGenerating: boolean;
  onRegenerate: () => void;
  onCoverLetterChange: (value: string) => void;
  /** Skip the typing animation, e.g. when loading a saved draft. */
  instant?: boolean;
  meta?: PreviewPanelMeta | null;
}

export const PARAGRAPH_SEPARATOR = /\n\s*\n/;

export function isRewritable(paragraph: string): boolean {
  return paragraph.trim().split(/\s+/).length >= 8;
}

export function PreviewPanel({
  coverLetter,
  letterRunKey,
  isGenerating,
  onRegenerate,
  onCoverLetterChange,
  instant = false,
  meta = null,
}: PreviewPanelProps) {
  const { displayedText, isTyping } = useTypingAnimation({
    text: coverLetter,
    runKey: letterRunKey,
    speed: 10,
    enabled: !!coverLetter && !instant,
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setSelectedIndex(null);
    setRegeneratingIndex(null);
  }, [letterRunKey]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(coverLetter);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }

  function handleParagraphChange(
    paragraphs: string[],
    index: number,
    value: string,
  ) {
    const next = [...paragraphs];
    next[index] = value;
    onCoverLetterChange(next.join('\n\n'));
  }

  async function handleRewrite(paragraphs: string[], index: number) {
    if (!meta) return;
    const paragraph = paragraphs[index];

    setRegeneratingIndex(index);
    try {
      const res = await fetch('/api/regenerate-paragraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullLetter: coverLetter,
          paragraph,
          role: meta.role,
          company: meta.company,
          jobDescription: meta.jobDescription,
          requirements: meta.requirements,
          tone: meta.tone,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'Could not rewrite that paragraph.');
        return;
      }

      const next = [...paragraphs];
      next[index] = json.paragraph;
      onCoverLetterChange(next.join('\n\n'));
      toast.success('Paragraph updated.');
    } catch {
      toast.error('Network error. Please check your connection.');
    } finally {
      setRegeneratingIndex(null);
    }
  }

  const hasContent = !!coverLetter && !isGenerating;
  const paragraphs =
    hasContent && !isTyping ? coverLetter.split(PARAGRAPH_SEPARATOR) : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="text-foreground text-base font-semibold">Draft</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Click a paragraph to rewrite just that part, or edit anywhere before
            you send it.
          </p>
        </div>
        {hasContent && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6 sm:pb-6">
        {isGenerating ? (
          <div className="space-y-3 pt-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="pt-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : hasContent && isTyping ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={letterRunKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <Textarea
                aria-label="Cover letter draft"
                readOnly
                value={displayedText}
                onChange={() => {}}
                className="text-foreground min-h-[min(50vh,28rem)] w-full resize-none border-0 bg-transparent px-0 py-0 font-sans text-sm leading-relaxed shadow-none read-only:cursor-default focus-visible:ring-0"
              />
            </motion.div>
          </AnimatePresence>
        ) : hasContent ? (
          <motion.div
            key={letterRunKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-2"
          >
            {paragraphs.map((paragraph, index) => {
              const isSelected = selectedIndex === index;
              const eligible = isRewritable(paragraph);
              const isRegenerating = regeneratingIndex === index;

              return (
                <div
                  key={index}
                  className={cn(
                    '-mx-3 rounded-lg border px-3 py-2 transition-colors',
                    isSelected
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40'
                      : 'hover:bg-muted/40 border-transparent',
                  )}
                >
                  <div className="relative">
                    <Textarea
                      aria-label={`Paragraph ${index + 1}`}
                      value={paragraph}
                      onFocus={() => setSelectedIndex(index)}
                      onClick={() => setSelectedIndex(index)}
                      onChange={(e) =>
                        handleParagraphChange(paragraphs, index, e.target.value)
                      }
                      className="text-foreground min-h-0 w-full resize-none border-0 bg-transparent px-0 py-0 font-sans text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                    />
                    {isSelected && eligible && meta && (
                      <div className="absolute -top-3 right-0 z-10">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isRegenerating}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleRewrite(paragraphs, index)}
                          className="h-6 gap-1 rounded-full px-2.5 text-[11px] shadow-sm"
                        >
                          {isRegenerating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          {isRegenerating ? 'Rewriting' : 'Rewrite'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground h-5 w-5" />
            </div>
            <p className="text-muted-foreground max-w-55 text-sm">
              Generated text will show here when ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
