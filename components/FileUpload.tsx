'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, RotateCcw, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  cachedResumeFileName?: string | null;
  useCachedResume?: boolean;
  onUseCachedResume?: (use: boolean) => void;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function FileUpload({
  value,
  onChange,
  error,
  cachedResumeFileName,
  useCachedResume = false,
  onUseCachedResume,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        onChange(acceptedFiles[0]);
      }
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: { 'application/pdf': ['.pdf'] },
      maxSize: MAX_SIZE,
      maxFiles: 1,
    });

  const rejectionCode = fileRejections[0]?.errors[0]?.code;
  const rejectionError =
    rejectionCode === 'file-too-large'
      ? 'File must be under 2 MB.'
      : rejectionCode === 'file-invalid-type'
        ? 'File must be a PDF.'
        : fileRejections[0]?.errors[0]?.message;
  const displayError = error ?? rejectionError;

  function formatBytes(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (value) {
    return (
      <div className="border-border bg-muted/40 flex items-center gap-3 rounded-lg border px-4 py-3">
        <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">
            {value.name}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatBytes(value.size)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1 transition-colors"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (useCachedResume && cachedResumeFileName) {
    return (
      <div className="border-border bg-muted/40 flex items-center gap-3 rounded-lg border px-4 py-3">
        <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-medium">
            {cachedResumeFileName}
          </p>
          <p className="text-muted-foreground text-xs">Using last resume</p>
        </div>
        <button
          type="button"
          onClick={() => onUseCachedResume?.(false)}
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1 transition-colors"
          aria-label="Stop using last resume"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
          isDragActive
            ? 'border-foreground bg-muted/50'
            : 'border-border bg-muted/20 hover:border-muted-foreground/50 hover:bg-muted/30',
          displayError && 'border-destructive',
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud
          className={cn(
            'h-8 w-8 transition-colors',
            isDragActive ? 'text-foreground' : 'text-muted-foreground',
          )}
        />
        <div className="text-center">
          <p className="text-foreground text-sm font-medium">
            {isDragActive ? 'Drop file here' : 'Upload PDF'}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            CV or resume · PDF only · max 2 MB
          </p>
        </div>
      </div>
      {cachedResumeFileName && (
        <button
          type="button"
          onClick={() => onUseCachedResume?.(true)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Use last resume ({cachedResumeFileName})
        </button>
      )}
      {displayError && (
        <p className="text-destructive text-xs">{displayError}</p>
      )}
    </div>
  );
}
