# HireSense AI — Explainable Resume Screening & Job Matching

A Next.js (App Router) + PostgreSQL (Drizzle ORM) app that scores resumes
against job descriptions with explainable evidence — matched skills, partial
matches, missing skills, and a plain-language reason for every score. No
black-box AI: matching is deterministic and auditable.

## Stack

- **Framework:** Next.js 16 (App Router, React 19, Tailwind CSS 4)
- **Database:** PostgreSQL via Drizzle ORM + `pg`
- **Auth:** Session cookies (`bcryptjs` password hashing, 14-day sessions)
- **Parsing:** PDF (`pdf-parse-fork`), DOCX (`mammoth`), plain text

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure the database**

   Copy the env template and point it at your Postgres instance:

   ```bash
   cp .env.example .env
   # edit .env → DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
   ```

   The app refuses to start without `DATABASE_URL`. A default local dev URL
   (`postgresql://postgres:postgres@127.0.0.1:5432/app_db`) is provided in
   `.env` — adjust it to match your Postgres credentials, and create the
   database if it doesn't exist yet.

3. **Create the schema**

   ```bash
   npm run db:push
   ```

   This creates all tables (`users`, `sessions`, `resumes`, `jobs`, `matches`,
   `recommendations`) plus the enums.

4. **Run the app**

   ```bash
   npm run dev        # http://localhost:3000
   # or production:
   npm run build && npm start
   ```

## Useful scripts

| Script             | What it does                                   |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Start the dev server                           |
| `npm run build`    | Production build (typecheck + compile)         |
| `npm run start`    | Serve the production build                     |
| `npm run db:push`  | Push the Drizzle schema to the database        |
| `npm run typecheck`| Typecheck with `tsc --noEmit`                  |
| `npm run lint`     | ESLint                                         |

## Features

- **Candidates:** upload a resume (PDF/DOCX/TXT or pasted text) → get an ATS
  score with per-check breakdown, extracted skills/experience/education, and
  rewrite suggestions for weak bullets and skill gaps.
- **Matching:** paste any job description → overall score weighted from skill
  match, experience, semantic fit, and ATS score, with matched/partial/missing
  skill evidence and a generated explanation.
- **Recruiters:** create jobs (required vs. preferred skills auto-parsed),
  batch-screen resumes against a job, rank/sort candidates, update shortlist
  status, compare candidates, and export a CSV report.

## Troubleshooting

- **`DATABASE_URL is required`** — you're missing the `.env` file. Copy
  `.env.example` to `.env` and fill in a valid Postgres URL.
- **Windows build panic about `failed to create junction point`** — a known
  Turbopack-on-Windows bug where symlinks left in `.next` from a previous build
  break the next one. `npm run build` now cleans `.next` automatically via the
  `prebuild` hook, so no manual step is needed.
- **Connection refused on `127.0.0.1:5432`** — Postgres isn't running locally.
  Start it, or point `DATABASE_URL` at a reachable instance.
