'use client';

import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/FileUpload';

const schema = z.object({
  file: z
    .instanceof(File, { message: 'Please upload your CV as a PDF.' })
    .refine((f) => f.type === 'application/pdf', 'File must be a PDF.')
    .refine((f) => f.size <= 2 * 1024 * 1024, 'File must be under 2 MB.')
    .nullable()
    .optional(),
  role: z.string().min(1, 'Role is required.'),
  company: z.string().min(1, 'Company is required.'),
  jobDescription: z.string().min(20, 'Please provide a job description (min 20 characters).'),
  requirements: z.string().optional(),
  tone: z.enum(['Professional', 'Casual', 'Confident']),
});

type FormValues = z.infer<typeof schema>;

interface CoverLetterFormProps {
  onGenerate: (coverLetter: string) => void;
  onGenerating: (isGenerating: boolean) => void;
  isGenerating: boolean;
}

export function CoverLetterForm({
  onGenerate,
  onGenerating,
  isGenerating,
}: CoverLetterFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tone: 'Professional',
      file: null,
    },
  });

  const fileValue = watch('file');

  const { field: toneField } = useController({
    name: 'tone',
    control,
  });

  async function onSubmit(data: FormValues) {
    onGenerating(true);

    try {
      const formData = new FormData();
      if (data.file) formData.append('file', data.file);
      formData.append('role', data.role);
      formData.append('company', data.company);
      formData.append('jobDescription', data.jobDescription);
      formData.append('requirements', data.requirements ?? '');
      formData.append('tone', data.tone);

      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'Generation failed. Please try again.');
        return;
      }

      onGenerate(json.coverLetter);
    } catch {
      toast.error('Network error. Please check your connection.');
    } finally {
      onGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* CV Upload */}
      <div className="space-y-1.5">
        <Label>Your CV</Label>
        <p className="text-xs text-muted-foreground">
          We&apos;ll use this to write a cover letter based on your real experience.
        </p>
        <FileUpload
          value={(fileValue as File) ?? null}
          onChange={(file) => setValue('file', file, { shouldValidate: true })}
          error={errors.file?.message as string | undefined}
        />
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label htmlFor="role">
          What role are you applying for?
        </Label>
        <p className="text-xs text-muted-foreground">
          The exact job title from the listing works best.
        </p>
        <Input
          id="role"
          placeholder="e.g. Frontend Engineer"
          {...register('role')}
          aria-invalid={!!errors.role}
        />
        {errors.role && (
          <p className="text-xs text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* Company */}
      <div className="space-y-1.5">
        <Label htmlFor="company">
          Which company is this for?
        </Label>
        <p className="text-xs text-muted-foreground">
          We&apos;ll personalise the letter specifically for this company.
        </p>
        <Input
          id="company"
          placeholder="e.g. Stripe"
          {...register('company')}
          aria-invalid={!!errors.company}
        />
        {errors.company && (
          <p className="text-xs text-destructive">{errors.company.message}</p>
        )}
      </div>

      {/* Job Description */}
      <div className="space-y-1.5">
        <Label htmlFor="jobDescription">
          Paste the job description
        </Label>
        <p className="text-xs text-muted-foreground">
          The more detail you include, the better the result.
        </p>
        <Textarea
          id="jobDescription"
          placeholder="Paste the full job description here..."
          rows={5}
          {...register('jobDescription')}
          aria-invalid={!!errors.jobDescription}
        />
        {errors.jobDescription && (
          <p className="text-xs text-destructive">
            {errors.jobDescription.message}
          </p>
        )}
      </div>

      {/* Requirements */}
      <div className="space-y-1.5">
        <Label htmlFor="requirements">
          What are they looking for?
        </Label>
        <p className="text-xs text-muted-foreground">
          We&apos;ll match your experience to what they actually need.
        </p>
        <Textarea
          id="requirements"
          placeholder="e.g. 3+ years React, strong TypeScript, team leadership..."
          rows={3}
          {...register('requirements')}
        />
      </div>

      {/* Tone */}
      <div className="space-y-1.5">
        <Label>How should the letter sound?</Label>
        <p className="text-xs text-muted-foreground">
          Pick the tone that fits you and the company culture.
        </p>
        <Select
          value={toneField.value}
          onValueChange={toneField.onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Professional">Professional</SelectItem>
            <SelectItem value="Casual">Casual</SelectItem>
            <SelectItem value="Confident">Confident</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isGenerating}
        className="w-full bg-foreground text-background hover:bg-foreground/90"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Write My Cover Letter'
        )}
      </Button>
    </form>
  );
}
