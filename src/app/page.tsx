import Link from "next/link";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const candidateHref = user ? "/dashboard" : "/signup?role=candidate";
  const recruiterHref = user ? "/recruiter" : "/signup?role=recruiter";

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
      <Nav />

      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-in">
            <p className="mb-4 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
              Explainable AI recruitment
            </p>
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.05] tracking-tight text-slate-950">
              Know exactly why a resume matches — or doesn&apos;t.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Upload a resume and a job description. Get a match score backed by
              evidence, not a black box — matched skills, gaps, and a plain-language
              reason for every number.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={candidateHref}
                className="rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
              >
                Analyze my resume
              </Link>
              <Link
                href={recruiterHref}
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
              >
                I&apos;m hiring →
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
              <span>✓ No black-box scores</span>
              <span>✓ Skill-gap evidence</span>
              <span>✓ ATS-ready suggestions</span>
            </div>
          </div>

          <div className="animate-fade-in rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Sample match result
                </p>
                <p className="font-display text-lg font-medium text-slate-950">
                  Python Backend Developer
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono-tight text-3xl font-semibold text-emerald-600">87%</div>
                <p className="text-xs font-medium text-slate-500">Strong overall fit</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  ✓ Matched
                </p>
                <p className="text-sm text-emerald-900">Python, FastAPI, SQL</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">
                  ✗ Missing
                </p>
                <p className="text-sm text-rose-900">Docker, AWS</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Strong backend fundamentals and directly relevant project experience
              carry most of the score. The gap comes from two preferred technologies
              not yet demonstrated.
            </div>
          </div>
        </div>

        <section className="mt-28 grid gap-8 sm:grid-cols-3">
          <FeatureCard
            title="For candidates"
            body="Upload your resume, see your match score against any job, and get rewritten bullet points that fix the exact gaps found."
            cta={{ href: candidateHref, label: "Analyze my resume" }}
          />
          <FeatureCard
            title="For recruiters"
            body="Screen dozens of resumes against one role in minutes. Rank, filter, and export — with the evidence behind every score."
            cta={{ href: recruiterHref, label: "Start screening" }}
          />
          <FeatureCard
            title="Always explainable"
            body="Every score ships with matched, partial, and missing evidence plus a plain-language reason — never just a number."
            cta={{ href: "/login", label: "See how it works" }}
          />
        </section>
      </main>

      <footer className="mt-24 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        HireSense AI · Explainable AI resume screening & job matching
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="font-display text-xl font-medium text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <Link href={cta.href} className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:text-violet-900">
        {cta.label} →
      </Link>
    </div>
  );
}
