'use client';

import { useEffect } from 'react';
import { Copy, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';

interface PreviewPanelProps {
  coverLetter: string;
  isGenerating: boolean;
  onRegenerate: () => void;
}

export function PreviewPanel({
  coverLetter,
  isGenerating,
  onRegenerate,
}: PreviewPanelProps) {
  const { displayedText, isTyping } = useTypingAnimation({
    text: coverLetter,
    speed: 18,
    enabled: !!coverLetter,
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(coverLetter);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  }

  const hasContent = !!coverLetter && !isGenerating;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Your Cover Letter
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Feel free to edit it. It&apos;s yours.
          </p>
        </div>
        {hasContent && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
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
        ) : hasContent ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={coverLetter.slice(0, 20)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {displayedText}
                {isTyping && (
                  <span className="inline-block h-4 w-0.5 animate-pulse bg-foreground ml-0.5 translate-y-0.5" />
                )}
              </pre>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Your cover letter will appear here once it&apos;s ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
