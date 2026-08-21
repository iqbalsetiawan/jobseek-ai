import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { isRateLimited } from '@/lib/rateLimit';
import {
  BANNED_PHRASES,
  buildContactTokens,
  cleanText,
  getToneGuide,
  mergeContactSentence,
  normalizeHyphenBuzzwords,
} from '@/lib/coverLetter';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function buildMessages(params: {
  cvText: string;
  role: string;
  company: string;
  jobDescription: string;
  requirements: string;
  tone: string;
  linkedin: string;
  email: string;
}): { role: string; content: string }[] {
  const { cvText, role, company, jobDescription, requirements, tone } = params;
  const hasLinkedin = !!params.linkedin.trim();
  const hasEmail = !!params.email.trim();
  const contactTokens = buildContactTokens(hasLinkedin, hasEmail);

  const toneGuide = getToneGuide(tone);

  const bannedList = BANNED_PHRASES.map((p) => `- "${p}"`).join('\n');

  const contactRuleLine =
    hasLinkedin && hasEmail
      ? `- FORMAT: In the final body paragraph before the sign-off, weave in one natural inline sentence inviting the reader to connect, using the exact placeholders [YOUR LINKEDIN] and [YOUR EMAIL] (e.g. "You can reach me on LinkedIn at [YOUR LINKEDIN] or by email at [YOUR EMAIL]"). This MUST be part of the paragraph's prose, on the same lines as the surrounding sentences. Do NOT put it on its own line, and do NOT add a heading or label like "Contact:". Do not invent real URLs or addresses.`
      : hasLinkedin
        ? `- FORMAT: In the final body paragraph before the sign-off, weave in one natural inline sentence inviting the reader to connect on LinkedIn, using the exact placeholder [YOUR LINKEDIN] (e.g. "Feel free to connect with me on LinkedIn at [YOUR LINKEDIN]"). This MUST be part of the paragraph's prose, on the same lines as the surrounding sentences. Do NOT put it on its own line, do NOT add a heading or label like "Contact:", and do not mention email. Do not invent a real URL.`
        : hasEmail
          ? `- FORMAT: In the final body paragraph before the sign-off, weave in one natural inline sentence inviting the reader to reach out by email, using the exact placeholder [YOUR EMAIL] (e.g. "You can reach me by email at [YOUR EMAIL]"). This MUST be part of the paragraph's prose, on the same lines as the surrounding sentences. Do NOT put it on its own line, do NOT add a heading or label like "Contact:", and do not mention LinkedIn. Do not invent a real address.`
          : `- FORMAT: Do not include any invitation to connect via LinkedIn or email, and do not use any placeholder for them. End the body paragraphs with a confident closing statement instead.`;

  const noOtherPlaceholdersLine = contactTokens
    ? `- FORMAT: After the body paragraphs, end with a professional sign-off on its own line (e.g. "Sincerely,", "Warmest regards,", "Best regards,", "Kind regards,"). Then one blank line for the candidate to add their name. Do NOT use any other bracket placeholders (no [Your Name], [Date], etc.) except ${contactTokens} as required above.`
    : `- FORMAT: After the body paragraphs, end with a professional sign-off on its own line (e.g. "Sincerely,", "Warmest regards,", "Best regards,", "Kind regards,"). Then one blank line for the candidate to add their name. Do NOT use any bracket placeholders anywhere in the letter (no [Your Name], [Date], [YOUR LINKEDIN], [YOUR EMAIL], etc.).`;

  const systemPrompt = `You are an expert cover letter writer. Your letters sound authentically human, not templated or AI-generated. You write in first person, naturally, like a real candidate who took time to think about the role.

STRICT RULES:
- Output ONLY the cover letter text. No preamble. No "Here is your cover letter:". No closing notes.
- FORMAT: Start with a one-line salutation on its own line (e.g. "Dear Hiring Manager," or "Dear ${company} Team,"). Use a real greeting, never "To whom it may concern".
${contactRuleLine}
${noOtherPlaceholdersLine}
- PUNCTUATION: Do not use em dashes, en dashes, or double hyphens (--) in the letter. Do not use a hyphen with spaces on each side as a pause between phrases. For breaks or asides, use commas, periods, or parentheses.
- NO HYPHENATED BUZZWORD PAIRS: Never write forms like "real-time", "user-friendly", "high-quality", "end-to-end", "best-in-class", "world-class", or similar adjective stacks joined by hyphens. Use a space between words ("real time", "user friendly"), one word, or rephrase naturally (e.g. "strong quality" instead of "high-quality").
- Do NOT use any of these phrases:
${bannedList}
- Do NOT use hollow adjectives: "dynamic", "synergistic", "results-driven", "forward-thinking"
- Do NOT start sentences with "I" more than twice in a row
- The first sentence of the opening body paragraph (the paragraph right after the salutation) must NOT start with "I"
- Vary sentence length: mix short punchy sentences with longer ones
- Minimum 3 body paragraphs (not counting salutation or sign-off lines), maximum 5 body paragraphs
- Include at least one specific, quantifiable achievement from the CV if one exists`;

  const closingStep = contactTokens
    ? `4. CLOSING: Confident restatement of fit, clear call to action, plus one inline sentence (same paragraph, not a new line or label) inviting follow-up that includes exactly this token: ${contactTokens}.`
    : `4. CLOSING: Confident restatement of fit and a clear call to action. Do not mention LinkedIn or email.`;

  const userPrompt = `Write a cover letter. Tone: ${toneGuide}

CANDIDATE CV:
${cvText}

ROLE: ${role}
COMPANY: ${company}

JOB DESCRIPTION:
${jobDescription}

REQUIREMENTS:
${requirements}

Follow this structure:
0. SALUTATION: One line only, comma at the end (e.g. Dear Hiring Manager,).
1. OPENING: Specific hook tied to this company/role. Show you know something about this company. Never use a generic opener.
2. BODY 1: Most relevant experience from the CV with concrete examples and numbers where possible.
3. BODY 2: Match skills from the CV to the job requirements naturally.
${closingStep}
5. SIGN-OFF: One line: Sincerely, or Warmest regards, or Best regards, or Kind regards, (pick one that fits the tone). Then one blank line, nothing after that.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';
    if (isRateLimited(`generate:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 },
      );
    }

    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const role = (formData.get('role') as string) ?? '';
    const company = (formData.get('company') as string) ?? '';
    const jobDescription = (formData.get('jobDescription') as string) ?? '';
    const requirements = (formData.get('requirements') as string) ?? '';
    const tone = (formData.get('tone') as string) ?? 'Professional';
    const includeLinkedin =
      (formData.get('includeLinkedin') as string) !== 'false';
    const linkedin = includeLinkedin
      ? ((formData.get('linkedin') as string) ?? '').trim()
      : '';
    const includeEmail = (formData.get('includeEmail') as string) !== 'false';
    const email = includeEmail
      ? ((formData.get('email') as string) ?? '').trim()
      : '';

    if (!role || !company) {
      return NextResponse.json(
        { error: 'Position and company are required.' },
        { status: 400 },
      );
    }

    let cvText = '';
    let parsedFromFile = false;
    if (file && file.size > 0) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'CV must be a PDF file.' },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'CV file must be under 2 MB.' },
          { status: 400 },
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      const parsed = await pdfParse(Buffer.from(arrayBuffer));
      cvText = cleanText(parsed.text);
      parsedFromFile = true;
    } else {
      const resumeText = (formData.get('resumeText') as string) ?? '';
      if (resumeText.trim()) {
        cvText = cleanText(resumeText);
      }
    }

    if (!cvText.trim()) {
      return NextResponse.json({ error: 'CV is required.' }, { status: 400 });
    }

    const messages = buildMessages({
      cvText,
      role,
      company,
      jobDescription:
        jobDescription.slice(0, 2000).trim() ||
        'Not provided. Write generally about fit for this role and company based on the CV.',
      requirements: requirements.slice(0, 1000),
      tone,
      linkedin,
      email,
    });

    const hfModel =
      process.env.HUGGINGFACE_MODEL ?? 'meta-llama/Llama-3.1-8B-Instruct';
    const hfToken = process.env.HUGGINGFACE_API_TOKEN;

    if (!hfToken || hfToken === 'your_token_here') {
      return NextResponse.json(
        { error: 'Hugging Face API token is not configured.' },
        { status: 500 },
      );
    }

    // HuggingFace migrated to router.huggingface.co with OpenAI-compatible chat completions
    const hfResponse = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: hfModel,
          messages,
          max_tokens: 1000,
          temperature: 0.75,
          top_p: 0.9,
        }),
      },
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('HuggingFace API error:', hfResponse.status, errorText);
      return NextResponse.json(
        { error: 'AI generation failed. Please try again.' },
        { status: 502 },
      );
    }

    const hfData = await hfResponse.json();
    const rawLetter: string =
      hfData?.choices?.[0]?.message?.content?.trim() ?? '';
    let coverLetter = normalizeHyphenBuzzwords(rawLetter).trim();
    coverLetter = mergeContactSentence(coverLetter, !!linkedin, !!email);

    if (linkedin) {
      coverLetter = coverLetter.replaceAll('[YOUR LINKEDIN]', linkedin);
    }
    if (email) {
      coverLetter = coverLetter.replaceAll('[YOUR EMAIL]', email);
    }

    if (!coverLetter) {
      console.error('Unexpected HF response shape:', JSON.stringify(hfData));
      return NextResponse.json(
        { error: 'Unexpected response from AI model.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      coverLetter,
      ...(parsedFromFile ? { cvText } : {}),
    });
  } catch (err) {
    console.error('generate-cover-letter error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
