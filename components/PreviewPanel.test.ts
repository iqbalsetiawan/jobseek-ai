import { describe, expect, it } from 'vitest';
import { isRewritable, PARAGRAPH_SEPARATOR } from './PreviewPanel';

describe('isRewritable', () => {
  it('rejects the short salutation line', () => {
    expect(isRewritable('Dear Hiring Manager,')).toBe(false);
  });

  it('rejects the short sign-off line', () => {
    expect(isRewritable('Sincerely,')).toBe(false);
  });

  it('accepts a full body paragraph', () => {
    const paragraph =
      'I led the redesign of our checkout flow, cutting drop off by 20 percent within two months of launch.';
    expect(isRewritable(paragraph)).toBe(true);
  });

  it('is a boundary at exactly 8 words', () => {
    expect(isRewritable('one two three four five six seven eight')).toBe(true);
    expect(isRewritable('one two three four five six seven')).toBe(false);
  });
});

describe('PARAGRAPH_SEPARATOR', () => {
  it('splits a letter into its blank-line delimited paragraphs', () => {
    const letter =
      'Dear Hiring Manager,\n\nI led the project.\n\nI also managed the team.\n\nSincerely,';
    expect(letter.split(PARAGRAPH_SEPARATOR)).toEqual([
      'Dear Hiring Manager,',
      'I led the project.',
      'I also managed the team.',
      'Sincerely,',
    ]);
  });

  it('treats extra blank lines between paragraphs as one separator', () => {
    const letter = 'First paragraph.\n\n\nSecond paragraph.';
    expect(letter.split(PARAGRAPH_SEPARATOR)).toEqual([
      'First paragraph.',
      'Second paragraph.',
    ]);
  });
});
