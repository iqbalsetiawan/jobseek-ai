import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

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

function buildPrompt(params: {
  cvText: string;
  role: string;
  company: string;
  jobDescription: string;
  requirements: string;
  tone: string;
}): string {
  const { cvText, role, company, jobDescription, requirements, tone } = params;

  const toneGuide = {
    Professional:
      'polished and confident, warm but structured — like a senior professional who knows their worth without being boastful',
    Casual:
      'conversational and approachable, like writing to someone you met at a networking event — relaxed cadence, first-name energy, still sharp',
    Confident:
      'assertive and forward-looking, use strong active verbs, make direct claims backed by evidence from the CV — no hedging',
  }[tone] ?? 'professional and human';

  const bannedList = BANNED_PHRASES.map((p) => `- "${p}"`).join('\n');

  return `You are an expert cover letter writer who specializes in making letters sound authentically human — not templated, not AI-generated.

Your task: Write a cover letter for the following candidate applying for a role. The letter must read like it was written by a real, thoughtful person who did their homework.

---
CANDIDATE CV:
${cvText}
---
ROLE: ${role}
COMPANY: ${company}
---
JOB DESCRIPTION:
${jobDescription}
---
REQUIREMENTS:
${requirements}
---
TONE: ${toneGuide}

---
STRUCTURE (follow this exactly, 4 paragraphs):

1. OPENING — Start with a specific, compelling hook that ties the candidate's background directly to this company or role. Show that you know something specific about this company or why this role matters. Never start with "I am writing to..." or any generic opener. Make the reader want to keep going.

2. BODY PARAGRAPH 1 — Highlight the most relevant experience from the CV using concrete examples. If there are numbers, use them (e.g. "built a system that handled 50k requests/day", "reduced build time by 40%"). Do not simply repeat the CV — tell a brief story that shows impact.

3. BODY PARAGRAPH 2 — Match specific skills from the CV to the job requirements. Show you understand what the company actually needs. Reference the job description naturally — don't list requirements robotically.

4. CLOSING — Restate fit briefly and confidently. Express genuine interest without desperation. End with a clear, natural call to action (e.g. "I'd love to talk through how I can contribute to [specific thing at the company]"). Sign off naturally.

---
STRICT RULES:
- Write in first person
- Do NOT use any of these phrases:
${bannedList}
- Do NOT use hollow adjectives like "dynamic", "synergistic", "results-driven", "forward-thinking"
- Do NOT start sentences with "I" more than twice in a row
- Vary sentence length — mix short punchy sentences with longer ones
- One paragraph should include at least one specific, quantifiable achievement from the CV
- The opening sentence must NOT start with "I"
- No placeholder text like [Your Name] or [Date]
- No preamble like "Here is your cover letter:" — output ONLY the letter
- Maximum 5 paragraphs, minimum 3
- Sound like a real human wrote this after thinking carefully about the role

[INST] Write the cover letter now. Output only the letter text. [/INST]`;
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
      const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });
      const result = await parser.getText();
      cvText = cleanText(result.text);
    }

    const prompt = buildPrompt({
      cvText,
      role,
      company,
      jobDescription: jobDescription.slice(0, 2000),
      requirements: requirements.slice(0, 1000),
      tone,
    });

    const hfModel =
      process.env.HUGGINGFACE_MODEL ??
      'mistralai/Mixtral-8x7B-Instruct-v0.1';
    const hfToken = process.env.HUGGINGFACE_API_TOKEN;

    if (!hfToken || hfToken === 'your_token_here') {
      return NextResponse.json(
        { error: 'Hugging Face API token is not configured.' },
        { status: 500 },
      );
    }

    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${hfModel}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false,
          },
        }),
      },
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('HuggingFace API error:', errorText);
      return NextResponse.json(
        { error: 'AI generation failed. Please try again.' },
        { status: 502 },
      );
    }

    const hfData = await hfResponse.json();

    let coverLetter: string = '';
    if (Array.isArray(hfData) && hfData[0]?.generated_text) {
      coverLetter = hfData[0].generated_text.trim();
    } else if (typeof hfData?.generated_text === 'string') {
      coverLetter = hfData.generated_text.trim();
    } else {
      return NextResponse.json(
        { error: 'Unexpected response from AI model.' },
        { status: 502 },
      );
    }

    // Strip any prompt leakage — only keep content after [/INST] if present
    const instIdx = coverLetter.lastIndexOf('[/INST]');
    if (instIdx !== -1) {
      coverLetter = coverLetter.slice(instIdx + '[/INST]'.length).trim();
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
