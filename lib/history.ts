const STORAGE_KEY = 'jobseekai-history';

export type CoverLetterTone = 'Professional' | 'Casual' | 'Confident';

export interface CoverLetterHistoryEntry {
  id: string;
  company: string;
  role: string;
  tone: CoverLetterTone;
  jobDescription: string;
  requirements: string;
  linkedin: string;
  includeLinkedin: boolean;
  email: string;
  includeEmail: boolean;
  coverLetter: string;
  createdAt: number;
}

export function getHistory(): CoverLetterHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries: CoverLetterHistoryEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Only the most recent draft is kept; each generate replaces it. */
export function saveToHistory(
  entry: Omit<CoverLetterHistoryEntry, 'id' | 'createdAt'>,
): CoverLetterHistoryEntry[] {
  const newEntry: CoverLetterHistoryEntry = {
    ...entry,
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
  };
  const updated = [newEntry];
  persist(updated);
  return updated;
}

export function deleteFromHistory(id: string): CoverLetterHistoryEntry[] {
  const updated = getHistory().filter((entry) => entry.id !== id);
  persist(updated);
  return updated;
}
