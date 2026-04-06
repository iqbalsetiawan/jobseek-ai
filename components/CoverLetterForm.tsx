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
  jobDescription: z
    .string()
    .min(20, 'Please provide a job description (min 20 characters).'),
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
    <form
      id="cover-letter-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* CV Upload */}
      <div className="space-y-1.5">
        <Label>Your CV or resume</Label>
        <p className="text-muted-foreground text-xs">
          We read what you&apos;ve done so the letter matches your background.
        </p>
        <FileUpload
          value={(fileValue as File) ?? null}
          onChange={(file) => setValue('file', file, { shouldValidate: true })}
          error={errors.file?.message as string | undefined}
        />
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label htmlFor="role">Position or job title</Label>
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
        <Label htmlFor="company">Employer or organisation</Label>
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
        <Label htmlFor="requirements">
          Must-haves and nice-to-haves (optional)
        </Label>
        <p className="text-muted-foreground text-xs">
          Skills, experience level, certifications, or soft skills they mention.
        </p>
        <Textarea
          id="requirements"
          placeholder="e.g. client-facing experience, budget ownership, leadership experience, language requirements, etc."
          rows={3}
          {...register('requirements')}
        />
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
      <Button
        type="submit"
        disabled={isGenerating}
        className="bg-foreground text-background hover:bg-foreground/90 w-full"
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
    </form>
  );
}
