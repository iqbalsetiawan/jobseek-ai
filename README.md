# JobSeekAI

Next.js app that helps you draft **cover letters** tailored to a role and company. Upload a CV as PDF (optional), paste the job description and requirements, pick a tone, and generate text via the [Hugging Face Inference API](https://huggingface.co/docs/api-inference) (OpenAI-compatible chat completions on `router.huggingface.co`).

## Features

- Form for role, company, job description, and requirements; optional CV PDF parsing on the server (`pdf-parse`)
- Tone presets: Professional, Casual, Confident
- Live preview panel with copy/regenerate
- Dark/light theme (`next-themes`), responsive layout with sidebar and mobile drawer
- UI built with React 19, Tailwind CSS 4, and shadcn-style components (`@base-ui/react`)

## Requirements

- Node.js 20+ (matches `@types/node` in the project)
- A [Hugging Face](https://huggingface.co/settings/tokens) access token with permission to call inference for your chosen model

## Environment variables

Create `.env.local` in the project root:

| Variable | Required | Description |
|----------|----------|-------------|
| `HUGGINGFACE_API_TOKEN` | Yes | Bearer token for `https://router.huggingface.co/v1/chat/completions` |
| `HUGGINGFACE_MODEL` | No | Model id (default: `Qwen/Qwen2.5-7B-Instruct`) |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical site URL for metadata and OG (no trailing slash). Falls back to `VERCEL_URL` or `http://localhost:5173` |

## Scripts

```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm run build
npm run start    # production server on port 5173
npm run lint
npm run lint:fix
npm run prettier
npm run prettier:fix
```

## Project structure (high level)

- `app/page.tsx` — main cover letter flow (form + preview)
- `app/api/generate-cover-letter/route.ts` — parses PDF, builds prompts, calls Hugging Face
- `components/` — UI (form, upload, preview, sidebar, theme)

## Deploy

The app runs on Vercel like any Next.js app. Set `HUGGINGFACE_API_TOKEN` (and optionally `HUGGINGFACE_MODEL`, `NEXT_PUBLIC_SITE_URL`) in the project environment settings.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, ESLint 9, Prettier.
