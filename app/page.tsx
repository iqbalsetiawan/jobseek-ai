'use client';

import { useRef, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CoverLetterForm } from '@/components/CoverLetterForm';
import { PreviewPanel } from '@/components/PreviewPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'cover-letter' | 'improve-cv'>(
    'cover-letter',
  );
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Keep a ref to the form's submit trigger for Regenerate
  const submitTriggerRef = useRef<(() => void) | null>(null);

  function handleRegenerate() {
    if (submitTriggerRef.current) {
      submitTriggerRef.current();
    }
  }

  return (
    <div className="flex min-h-screen gap-4 p-4 bg-gray-50 dark:bg-gray-950 md:gap-6 md:p-6">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Form panel */}
      <div className="flex-1 min-w-0 rounded-xl border border-border bg-white dark:bg-gray-900 shadow-sm">
        <div className="h-full overflow-y-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-foreground">
              Write a Cover Letter That Sounds Like You
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your CV, fill in the job details, and we&apos;ll write a
              letter that feels personal — not like it came from a template.
            </p>
          </div>
          <CoverLetterForm
            onGenerate={setCoverLetter}
            onGenerating={setIsGenerating}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Preview panel */}
      <div className="flex-1 min-w-0 rounded-xl border border-border bg-white dark:bg-gray-900 shadow-sm">
        <div className="h-full overflow-y-auto px-6 py-6">
          <PreviewPanel
            coverLetter={coverLetter}
            isGenerating={isGenerating}
            onRegenerate={handleRegenerate}
          />
        </div>
      </div>
    </div>
  );
}
