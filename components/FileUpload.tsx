'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function FileUpload({ value, onChange, error }: FileUploadProps) {
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

  const rejectionError = fileRejections[0]?.errors[0]?.message;
  const displayError = error ?? rejectionError;

  function formatBytes(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {value.name}
          </p>
          <p className="text-xs text-muted-foreground">{formatBytes(value.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Remove file"
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
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors',
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
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? 'Drop your CV here' : 'Upload your CV'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            PDF only — max 2MB
          </p>
        </div>
      </div>
      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}
    </div>
  );
}
