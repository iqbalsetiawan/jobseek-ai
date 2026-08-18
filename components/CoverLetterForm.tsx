'use client';

import { useEffect, useState } from 'react';
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
import { useIsClient } from '@/hooks/useIsClient';
import { getLastResume, saveLastResume } from '@/lib/resume';

const schema = z.object({
  file: z
    .instanceof(File, { message: 'Please upload your CV as a PDF.' })
    .refine((f) => f.type === 'application/pdf', 'File must be a PDF.')
    .refine((f) => f.size <= 2 * 1024 * 1024, 'File must be under 2 MB.')
    .nullable()
    .optional(),
  role: z.string().min(1, 'Position is required.'),
  company: z.string().min(1, 'Company is required.'),
  jobDescription: z.string().optional(),
  requirements: z.string().optional(),
  tone: z.enum(['Professional', 'Casual', 'Confident']),
  linkedin: z.string().optional(),
  includeLinkedin: z.boolean(),
  email: z
    .string()
    .optional()
    .refine(
      (v) => !v || /\S+@\S+\.\S+/.test(v),
      'Enter a valid email address.',
    ),
  includeEmail: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export interface CoverLetterDraft {
  role: string;
  company: string;
  jobDescription: string;
  requirements: string;
  tone: FormValues['tone'];
  linkedin: string;
  includeLinkedin: boolean;
  email: string;
  includeEmail: boolean;
}

interface CoverLetterFormProps {
  onGenerate: (
    coverLetter: string,
    meta: {
      company: string;
      role: string;
      tone: FormValues['tone'];
      jobDescription: string;
      requirements: string;
      linkedin: string;
      includeLinkedin: boolean;
      email: string;
      includeEmail: boolean;
    },
  ) => void;
  onGenerating: (isGenerating: boolean) => void;
  isGenerating: boolean;
  draft?: CoverLetterDraft | null;
}

export function CoverLetterForm({
  onGenerate,
  onGenerating,
  isGenerating,
  draft,
}: CoverLetterFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tone: 'Professional',
      file: null,
      linkedin: '',
      includeLinkedin: true,
      email: '',
      includeEmail: true,
    },
  });

  const fileValue = watch('file');
  const linkedinValue = watch('linkedin');
  const includeLinkedinValue = watch('includeLinkedin');
  const emailValue = watch('email');
  const includeEmailValue = watch('includeEmail');
  const isClient = useIsClient();
  const lastResume = isClient ? getLastResume() : null;
  const [useCachedResume, setUseCachedResume] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (draft) {
      reset({ ...draft, file: null });
      setUseCachedResume(false);
      setHasGenerated(true);
    }
  }, [draft, reset]);

  function handleClearForm() {
    reset({
      role: '',
      company: '',
      jobDescription: '',
      requirements: '',
      tone: 'Professional',
      file: null,
      linkedin: '',
      includeLinkedin: true,
      email: '',
      includeEmail: true,
    });
    setUseCachedResume(false);
    setHasGenerated(false);
  }

  function handleUseCachedResume(use: boolean) {
    setUseCachedResume(use);
    if (use) {
      setValue('file', null, { shouldValidate: true });
    }
  }

  const { field: toneField } = useController({
    name: 'tone',
    control,
  });

  async function onSubmit(data: FormValues) {
    if (!data.file && !(useCachedResume && lastResume)) {
      setError('file', {
        type: 'manual',
        message: 'Please upload your CV as a PDF.',
      });
      return;
    }

    onGenerating(true);

    try {
      const formData = new FormData();
      if (data.file) {
        formData.append('file', data.file);
      } else if (useCachedResume && lastResume) {
        formData.append('resumeText', lastResume.cvText);
      }
      formData.append('role', data.role);
      formData.append('company', data.company);
      formData.append('jobDescription', data.jobDescription ?? '');
      formData.append('requirements', data.requirements ?? '');
      formData.append('tone', data.tone);
      formData.append('linkedin', data.linkedin ?? '');
      formData.append('includeLinkedin', String(data.includeLinkedin));
      formData.append('email', data.email ?? '');
      formData.append('includeEmail', String(data.includeEmail));

      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'Generation failed. Please try again.');
        return;
      }

      if (data.file && typeof json.cvText === 'string') {
        saveLastResume({ fileName: data.file.name, cvText: json.cvText });
      }

      setHasGenerated(true);

      onGenerate(json.coverLetter, {
        company: data.company,
        role: data.role,
        tone: data.tone,
        jobDescription: data.jobDescription ?? '',
        requirements: data.requirements ?? '',
        linkedin: data.linkedin ?? '',
        includeLinkedin: data.includeLinkedin,
        email: data.email ?? '',
        includeEmail: data.includeEmail,
      });
    } catch {
      toast.error('Network error. Please check your connection.');
    } finally {
      onGenerating(false);
    }
  }

  return (
    <form
      id="cover-letter-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* CV Upload */}
      <div className="space-y-1.5">
        <Label>
          Your CV or resume <span className="text-destructive">*</span>
        </Label>
        <p className="text-muted-foreground text-xs">
          We read what you have done so the letter matches your background.
        </p>
        <FileUpload
          value={(fileValue as File) ?? null}
          onChange={(file) => {
            setUseCachedResume(false);
            setValue('file', file, { shouldValidate: true });
          }}
          error={errors.file?.message as string | undefined}
          cachedResumeFileName={lastResume?.fileName}
          useCachedResume={useCachedResume}
          onUseCachedResume={handleUseCachedResume}
        />
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label htmlFor="role">
          Position or job title <span className="text-destructive">*</span>
        </Label>
        <p className="text-muted-foreground text-xs">
          Use the title from the posting when you can.
        </p>
        <Input
          id="role"
          placeholder="e.g. Account Manager, Software Engineer, etc."
          {...register('role')}
          aria-invalid={!!errors.role}
        />
        {errors.role && (
          <p className="text-destructive text-xs">{errors.role.message}</p>
        )}
      </div>

      {/* Company */}
      <div className="space-y-1.5">
        <Label htmlFor="company">
          Employer or organisation <span className="text-destructive">*</span>
        </Label>
        <p className="text-muted-foreground text-xs">
          Helps tailor the opening and why you want to join them.
        </p>
        <Input
          id="company"
          placeholder="e.g. Google, Meta, etc."
          {...register('company')}
          aria-invalid={!!errors.company}
        />
        {errors.company && (
          <p className="text-destructive text-xs">{errors.company.message}</p>
        )}
      </div>

      {/* Job Description */}
      <div className="space-y-1.5">
        <Label htmlFor="jobDescription">Job description</Label>
        <p className="text-muted-foreground text-xs">
          Copy the main description from the advert or careers page.
        </p>
        <Textarea
          id="jobDescription"
          placeholder="Paste the role overview, responsibilities, and context here..."
          rows={5}
          className="resize-none"
          {...register('jobDescription')}
          aria-invalid={!!errors.jobDescription}
        />
        {errors.jobDescription && (
          <p className="text-destructive text-xs">
            {errors.jobDescription.message}
          </p>
        )}
      </div>

      {/* Requirements */}
      <div className="space-y-1.5">
        <Label htmlFor="requirements">Must haves and nice to haves</Label>
        <p className="text-muted-foreground text-xs">
          Skills, experience level, certifications, or soft skills they mention.
        </p>
        <Textarea
          id="requirements"
          placeholder="e.g. client facing experience, budget ownership, leadership experience, language requirements, etc."
          rows={3}
          className="resize-none"
          {...register('requirements')}
        />
      </div>

      {/* Contact info */}
      <div className="space-y-1.5">
        <Label htmlFor="linkedin">LinkedIn</Label>
        <div className="flex items-center gap-2">
          <Input
            id="linkedin"
            placeholder="linkedin.com/in/yourname"
            className="flex-1"
            {...register('linkedin')}
          />
          <label
            className={`flex shrink-0 items-center gap-1.5 text-xs ${linkedinValue ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
          >
            <input
              type="checkbox"
              checked={includeLinkedinValue}
              disabled={!linkedinValue}
              onChange={(e) => setValue('includeLinkedin', e.target.checked)}
              className="border-border accent-foreground h-3.5 w-3.5 rounded disabled:cursor-not-allowed"
            />
            Include
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="flex items-center gap-2">
          <Input
            id="email"
            placeholder="you@example.com"
            className="flex-1"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          <label
            className={`flex shrink-0 items-center gap-1.5 text-xs ${emailValue ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
          >
            <input
              type="checkbox"
              checked={includeEmailValue}
              disabled={!emailValue}
              onChange={(e) => setValue('includeEmail', e.target.checked)}
              className="border-border accent-foreground h-3.5 w-3.5 rounded disabled:cursor-not-allowed"
            />
            Include
          </label>
        </div>
        {errors.email && (
          <p className="text-destructive text-xs">{errors.email.message}</p>
        )}
      </div>

      {/* Tone */}
      <div className="space-y-1.5">
        <Label>Overall tone</Label>
        <p className="text-muted-foreground text-xs">
          Pick what feels closest to you and to how the employer writes.
        </p>
        <Select value={toneField.value} onValueChange={toneField.onChange}>
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
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isGenerating}
          className="bg-foreground text-background hover:bg-foreground/90 flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate cover letter'
          )}
        </Button>
        {hasGenerated && (
          <Button
            type="button"
            variant="outline"
            disabled={isGenerating}
            onClick={handleClearForm}
          >
            Clear all
          </Button>
        )}
      </div>
    </form>
  );
}
