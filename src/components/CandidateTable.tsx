"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { updateMatchStatusAction } from "@/actions/jobs";
import { StatusPill } from "@/components/ui";

export type CandidateRow = {
  matchId: string;
  resumeId: string;
  name: string;
  score: number;
  matchedCount: number;
  totalSkills: number;
  experienceYears: number;
  status: "shortlist" | "review" | "reject";
};

type SortKey = "score" | "experience" | "skills";

export default function CandidateTable({
  jobId,
  candidates,
}: {
  jobId: string;
  candidates: CandidateRow[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [rows, setRows] = useState(candidates);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === "score") return b.score - a.score;
      if (sortKey === "experience") return b.experienceYears - a.experienceYears;
      return b.matchedCount / Math.max(1, b.totalSkills) - a.matchedCount / Math.max(1, a.totalSkills);
    });
    return copy;
  }, [rows, sortKey]);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleStatusChange(matchId: string, status: CandidateRow["status"]) {
    setRows((prev) => prev.map((r) => (r.matchId === matchId ? { ...r, status } : r)));
    startTransition(() => updateMatchStatusAction(matchId, status));
  }

  const compareHref = `/recruiter/jobs/${jobId}/compare?ids=${Array.from(selected).join(",")}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Sort:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort candidates by"
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          >
            <option value="score">Match score ↓</option>
            <option value="experience">Experience ↓</option>
            <option value="skills">Skills ↓</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Skills</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.matchId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.matchId)}
                    onChange={() => toggleSelected(c.matchId)}
                    aria-label={`Select ${c.name} for comparison`}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                </td>
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/matches/${c.matchId}`} className="font-medium text-slate-900 hover:text-violet-700">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-mono-tight font-semibold ${
                      c.score >= 85 ? "text-emerald-600" : c.score >= 65 ? "text-violet-600" : "text-rose-600"
                    }`}
                  >
                    {c.score}%
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {c.matchedCount}/{c.totalSkills}
                </td>
                <td className="px-4 py-3 text-slate-700">{c.experienceYears} yrs</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusPill status={c.status} />
                    <select
                      value={c.status}
                      onChange={(e) =>
                        handleStatusChange(c.matchId, e.target.value as CandidateRow["status"])
                      }
                      aria-label={`Change status for ${c.name}`}
                      className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="shortlist">Shortlist</option>
                      <option value="review">Review</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No candidates screened yet. Upload resumes above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={selected.size > 0 ? compareHref : "#"}
          aria-disabled={selected.size === 0}
          className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
            selected.size > 0
              ? "border-slate-300 text-slate-700 hover:border-slate-400"
              : "cursor-not-allowed border-slate-200 text-slate-400"
          }`}
        >
          Compare selected {selected.size > 0 ? `(${selected.size})` : ""}
        </Link>
        <a
          href={`/api/recruiter/jobs/${jobId}/export`}
          className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          Export report
        </a>
      </div>
    </div>
  );
}
