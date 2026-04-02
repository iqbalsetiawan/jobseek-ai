import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

const BANNED_PHRASES = [
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

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim()
    .slice(0, 4000);
}

function buildMessages(params: {
  cvText: string;
  role: string;
  company: string;
  jobDescription: string;
  requirements: string;
  tone: string;
}): { role: string; content: string }[] {
  const { cvText, role, company, jobDescription, requirements, tone } = params;

  const toneGuide =
    {
      Professional:
        'polished and confident, warm but structured — like a senior professional who knows their worth without being boastful',
      Casual:
        'conversational and approachable, like writing to someone you met at a networking event — relaxed cadence, first-name energy, still sharp',
      Confident:
        'assertive and forward-looking, use strong active verbs, make direct claims backed by evidence from the CV — no hedging',
    }[tone] ?? 'professional and human';

  const bannedList = BANNED_PHRASES.map((p) => `- "${p}"`).join('\n');

  const systemPrompt = `You are an expert cover letter writer. Your letters sound authentically human — not templated, not AI-generated. You write in first person, naturally, like a real candidate who took time to think about the role.

STRICT RULES:
- Output ONLY the cover letter text. No preamble. No "Here is your cover letter:". No closing notes.
- Do NOT use any of these phrases:
${bannedList}
- Do NOT use hollow adjectives: "dynamic", "synergistic", "results-driven", "forward-thinking"
- Do NOT start sentences with "I" more than twice in a row
- The opening sentence must NOT start with "I"
- No placeholder text like [Your Name] or [Date]
- Vary sentence length — mix short punchy sentences with longer ones
- Minimum 3 paragraphs, maximum 5 paragraphs
- Include at least one specific, quantifiable achievement from the CV if one exists`;

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
1. OPENING — Specific hook tied to this company/role. Show you know something about this company. Never use a generic opener.
2. BODY 1 — Most relevant experience from the CV with concrete examples and numbers where possible.
3. BODY 2 — Match skills from the CV to the job requirements naturally.
4. CLOSING — Confident restatement of fit + clear call to action.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const role = (formData.get('role') as string) ?? '';
    const company = (formData.get('company') as string) ?? '';
    const jobDescription = (formData.get('jobDescription') as string) ?? '';
    const requirements = (formData.get('requirements') as string) ?? '';
    const tone = (formData.get('tone') as string) ?? 'Professional';

    if (!role || !company || !jobDescription) {
      return NextResponse.json(
        { error: 'Role, company, and job description are required.' },
        { status: 400 },
      );
    }

    let cvText = 'No CV provided.';
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const parsed = await pdfParse(Buffer.from(arrayBuffer));
      cvText = cleanText(parsed.text);
    }

    const messages = buildMessages({
      cvText,
      role,
      company,
      jobDescription: jobDescription.slice(0, 2000),
      requirements: requirements.slice(0, 1000),
      tone,
    });

    const hfModel =
      process.env.HUGGINGFACE_MODEL ?? 'Qwen/Qwen2.5-7B-Instruct';
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
          max_tokens: 900,
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
    const coverLetter: string =
      hfData?.choices?.[0]?.message?.content?.trim() ?? '';

    if (!coverLetter) {
      console.error('Unexpected HF response shape:', JSON.stringify(hfData));
      return NextResponse.json(
        { error: 'Unexpected response from AI model.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ coverLetter });
  } catch (err) {
    console.error('generate-cover-letter error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
