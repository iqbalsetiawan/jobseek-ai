const STORAGE_KEY = 'jobseekai-last-resume';

export interface LastResume {
  fileName: string;
  cvText: string;
  savedAt: number;
}

export function getLastResume(): LastResume | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.fileName === 'string' &&
      typeof parsed.cvText === 'string' &&
      typeof parsed.savedAt === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLastResume(resume: Omit<LastResume, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const entry: LastResume = { ...resume, savedAt: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function clearLastResume(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
