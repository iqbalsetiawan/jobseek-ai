import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rateLimit';
import {
  getToneGuide,
  normalizeHyphenBuzzwords,
  STRICT_STYLE_RULES,
} from '@/lib/coverLetter';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_FULL_LETTER_LENGTH = 8000;
const MAX_PARAGRAPH_LENGTH = 2000;

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';
    if (isRateLimited(`regen:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const fullLetter =
      typeof body.fullLetter === 'string' ? body.fullLetter : '';
    const paragraph = typeof body.paragraph === 'string' ? body.paragraph : '';
    const role = typeof body.role === 'string' ? body.role : '';
    const company = typeof body.company === 'string' ? body.company : '';
    const jobDescription =
      typeof body.jobDescription === 'string' ? body.jobDescription : '';
    const requirements =
      typeof body.requirements === 'string' ? body.requirements : '';
    const tone = typeof body.tone === 'string' ? body.tone : 'Professional';

    if (
      fullLetter.length > MAX_FULL_LETTER_LENGTH ||
      paragraph.length > MAX_PARAGRAPH_LENGTH
    ) {
      return NextResponse.json(
        { error: 'That letter or paragraph is too long to rewrite.' },
        { status: 400 },
      );
    }

    if (
      !fullLetter.trim() ||
      !paragraph.trim() ||
      !fullLetter.includes(paragraph)
    ) {
      return NextResponse.json(
        { error: 'Could not locate that paragraph in the letter.' },
        { status: 400 },
      );
    }

    const marked = fullLetter.replace(
      paragraph,
      `<<<PARAGRAPH TO REWRITE>>>\n${paragraph}\n<<<END PARAGRAPH>>>`,
    );

    const systemPrompt = `You are an expert cover letter editor. You will be shown a full cover letter with one paragraph marked between <<<PARAGRAPH TO REWRITE>>> and <<<END PARAGRAPH>>>. Rewrite ONLY that paragraph. Keep it a similar length to the original. Do not repeat information already covered in the other paragraphs. If the marked paragraph mentions a way to reach the candidate (a LinkedIn URL or an email address), keep that exact same detail in the rewrite. Sound authentically human, first person, not templated or AI-generated.

STRICT RULES:
- Output ONLY the replacement paragraph text. No preamble, no quotes, no markers, no labels.
${STRICT_STYLE_RULES}`;

    const userPrompt = `Tone: ${getToneGuide(tone)}

ROLE: ${role}
COMPANY: ${company}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

REQUIREMENTS:
${requirements.slice(0, 1000)}

FULL LETTER WITH TARGET PARAGRAPH MARKED:
${marked}`;

    const hfModel =
      process.env.HUGGINGFACE_MODEL ?? 'meta-llama/Llama-3.1-8B-Instruct';
    const hfToken = process.env.HUGGINGFACE_API_TOKEN;

    if (!hfToken || hfToken === 'your_token_here') {
      return NextResponse.json(
        { error: 'Hugging Face API token is not configured.' },
        { status: 500 },
      );
    }

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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 400,
          temperature: 0.8,
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
    const raw: string = hfData?.choices?.[0]?.message?.content?.trim() ?? '';
    const newParagraph = normalizeHyphenBuzzwords(raw)
      .trim()
      .replace(/^["']|["']$/g, '');

    if (!newParagraph) {
      console.error('Unexpected HF response shape:', JSON.stringify(hfData));
      return NextResponse.json(
        { error: 'Unexpected response from AI model.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ paragraph: newParagraph });
  } catch (err) {
    console.error('regenerate-paragraph error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
