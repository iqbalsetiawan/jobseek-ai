export type CoverLetterTone = 'Professional' | 'Casual' | 'Confident';

export const BANNED_PHRASES = [
  'I am writing to express my interest',
  'I am highly motivated',
  'I am passionate about',
  'I would be a great fit',
  'I am excited to apply',
  'Please find attached',
  'I believe I have the skills',
  'To whom it may concern',
  'I am eager to contribute',
  'I have always been passionate',
  'I am a hard worker',
  'I am a team player',
];

export function getToneGuide(tone: string): string {
  return (
    {
      Professional:
        'polished and structured, warm but formal, confident without sounding stiff',
      Casual:
        'conversational and approachable, relaxed cadence, warm and direct, still professional',
      Confident:
        'assertive and forward-looking, strong active verbs, direct claims backed by evidence from the CV, no hedging',
    }[tone] ?? 'professional and human'
  );
}

export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim()
    .slice(0, 4000);
}

export function normalizeHyphenBuzzwords(letter: string): string {
  let s = letter.replace(/–|—/g, ' ');
  s = s.replace(/--+/g, ' ');
  s = s.replace(/\s+-\s+/g, ', ');
  let prev = '';
  while (s !== prev) {
    prev = s;
    s = s.replace(/\b([A-Za-z]+)-([A-Za-z]+)\b/g, '$1 $2');
  }
  return s
    .split('\n')
    .map((line) => line.replace(/ {2,}/g, ' ').trimEnd())
    .join('\n');
}

export function mergeContactSentence(
  letter: string,
  hasLinkedin: boolean,
  hasEmail: boolean,
): string {
  if (!hasLinkedin && !hasEmail) return letter;

  const tokenPattern = /\[YOUR LINKEDIN\]|\[YOUR EMAIL\]/;
  const paragraphs = letter.split(/\n\s*\n/);

  for (let i = 1; i < paragraphs.length - 1; i++) {
    const paragraph = paragraphs[i];
    if (
      tokenPattern.test(paragraph) &&
      paragraph.trim().split(/\s+/).length < 30
    ) {
      paragraphs[i - 1] = `${paragraphs[i - 1].trimEnd()} ${paragraph.trim()}`;
      paragraphs.splice(i, 1);
      break;
    }
  }

  return paragraphs.join('\n\n');
}

export function buildContactTokens(
  hasLinkedin: boolean,
  hasEmail: boolean,
): string | null {
  if (hasLinkedin && hasEmail) return '[YOUR LINKEDIN] and [YOUR EMAIL]';
  if (hasLinkedin) return '[YOUR LINKEDIN]';
  if (hasEmail) return '[YOUR EMAIL]';
  return null;
}

export const STRICT_STYLE_RULES = `- PUNCTUATION: Do not use em dashes, en dashes, or double hyphens (--) in the text. Do not use a hyphen with spaces on each side as a pause between phrases. For breaks or asides, use commas, periods, or parentheses.
- NO HYPHENATED BUZZWORD PAIRS: Never write forms like "real-time", "user-friendly", "high-quality", "end-to-end", "best-in-class", "world-class", or similar adjective stacks joined by hyphens. Use a space between words ("real time", "user friendly"), one word, or rephrase naturally (e.g. "strong quality" instead of "high-quality").
- Do NOT use any of these phrases:
${BANNED_PHRASES.map((p) => `- "${p}"`).join('\n')}
- Do NOT use hollow adjectives: "dynamic", "synergistic", "results-driven", "forward-thinking"
- Do NOT start sentences with "I" more than twice in a row`;
