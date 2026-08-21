import { describe, expect, it } from 'vitest';
import {
  buildContactTokens,
  mergeContactSentence,
  normalizeHyphenBuzzwords,
} from './coverLetter';

describe('normalizeHyphenBuzzwords', () => {
  it('turns hyphenated buzzword pairs into spaced words', () => {
    expect(normalizeHyphenBuzzwords('a real-time, user-friendly tool')).toBe(
      'a real time, user friendly tool',
    );
  });

  it('replaces em and en dashes with a space', () => {
    expect(normalizeHyphenBuzzwords('fast — reliable – simple')).toBe(
      'fast reliable simple',
    );
  });

  it('collapses double hyphens into a space', () => {
    expect(normalizeHyphenBuzzwords('great -- truly great')).toBe(
      'great truly great',
    );
  });

  it('turns a spaced hyphen pause into a comma', () => {
    expect(normalizeHyphenBuzzwords('I led the team - and shipped it')).toBe(
      'I led the team, and shipped it',
    );
  });
});

describe('buildContactTokens', () => {
  it('returns both tokens when linkedin and email are present', () => {
    expect(buildContactTokens(true, true)).toBe(
      '[YOUR LINKEDIN] and [YOUR EMAIL]',
    );
  });

  it('returns only the linkedin token', () => {
    expect(buildContactTokens(true, false)).toBe('[YOUR LINKEDIN]');
  });

  it('returns only the email token', () => {
    expect(buildContactTokens(false, true)).toBe('[YOUR EMAIL]');
  });

  it('returns null when neither is present', () => {
    expect(buildContactTokens(false, false)).toBeNull();
  });
});

describe('mergeContactSentence', () => {
  it('is a no-op when there is no linkedin or email', () => {
    const letter = 'Para one.\n\nPara two.\n\nSincerely,';
    expect(mergeContactSentence(letter, false, false)).toBe(letter);
  });

  it('folds a short standalone contact paragraph into the previous one', () => {
    const letter =
      'Dear Hiring Manager,\n\nI led the project.\n\nYou can reach me on LinkedIn at [YOUR LINKEDIN].\n\nSincerely,';
    const result = mergeContactSentence(letter, true, false);
    expect(result).not.toContain(
      '\n\nYou can reach me on LinkedIn at [YOUR LINKEDIN].\n\n',
    );
    expect(result).toContain(
      'I led the project. You can reach me on LinkedIn at [YOUR LINKEDIN].',
    );
  });

  it('leaves the letter alone when no paragraph contains the token', () => {
    const letter = 'Dear Hiring Manager,\n\nI led the project.\n\nSincerely,';
    expect(mergeContactSentence(letter, true, false)).toBe(letter);
  });
});
