'use client';

import { Copy, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';

interface PreviewPanelProps {
  coverLetter: string;
  /** Increments only when a new letter is generated (not when the user edits). */
  letterRunKey: number;
  isGenerating: boolean;
  onRegenerate: () => void;
  onCoverLetterChange: (value: string) => void;
  /** Skip the typing animation, e.g. when loading a saved draft. */
  instant?: boolean;
}

export function PreviewPanel({
  coverLetter,
  letterRunKey,
  isGenerating,
  onRegenerate,
  onCoverLetterChange,
  instant = false,
}: PreviewPanelProps) {
  const { displayedText, isTyping } = useTypingAnimation({
    text: coverLetter,
    runKey: letterRunKey,
    speed: 10,
    enabled: !!coverLetter && !instant,
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
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="text-foreground text-base font-semibold">Draft</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Edit anywhere before you send it.
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
        ) : hasContent ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={letterRunKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative"
            >
              <Textarea
                aria-label="Cover letter draft"
                readOnly={isTyping}
                value={isTyping ? displayedText : coverLetter}
                onChange={(e) => onCoverLetterChange(e.target.value)}
                className="text-foreground min-h-[min(50vh,28rem)] w-full resize-none border-0 bg-transparent px-0 py-0 font-sans text-sm leading-relaxed shadow-none read-only:cursor-default focus-visible:ring-0"
              />
            </motion.div>
          </AnimatePresence>
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
