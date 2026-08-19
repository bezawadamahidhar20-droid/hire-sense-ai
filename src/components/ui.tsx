import type { ReactNode } from "react";

function scoreColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 85) return { ring: "#16a34a", text: "text-emerald-700", bg: "bg-emerald-50" };
  if (score >= 65) return { ring: "#7c3aed", text: "text-violet-700", bg: "bg-violet-50" };
  return { ring: "#e11d48", text: "text-rose-700", bg: "bg-rose-50" };
}

export function ScoreRing({
  score,
  size = 128,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = size * 0.09;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { ring, text } = scoreColor(score);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={`font-mono-tight text-3xl font-semibold ${text}`}>{score}%</div>
          {label && <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>}
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({ label, value }: { label: string; value: number }) {
  const { ring, text } = scoreColor(value);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={`font-mono-tight font-semibold ${text}`}>{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: ring }}
        />
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: "shortlist" | "review" | "reject" }) {
  const styles: Record<string, string> = {
    shortlist: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
    review: "bg-violet-100 text-violet-800 ring-violet-600/20",
    reject: "bg-rose-100 text-rose-800 ring-rose-600/20",
  };
  const labels: Record<string, string> = {
    shortlist: "Shortlist",
    review: "Review",
    reject: "Reject",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function AtsStatusPill({ status }: { status: "pass" | "warn" | "fail" }) {
  const styles: Record<string, string> = {
    pass: "bg-emerald-100 text-emerald-800",
    warn: "bg-amber-100 text-amber-800",
    fail: "bg-rose-100 text-rose-800",
  };
  const labels: Record<string, string> = {
    pass: "Passed",
    warn: "Needs attention",
    fail: "Failed",
  };
  const icons: Record<string, string> = { pass: "✓", warn: "⚠", fail: "✗" };
  return (
    <span
      role="img"
      aria-label={labels[status]}
      title={labels[status]}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${styles[status]}`}
    >
      {icons[status]}
    </span>
  );
}

export function SkillChip({
  skill,
  variant,
}: {
  skill: string;
  variant: "matched" | "missing" | "partial" | "neutral";
}) {
  const styles: Record<string, string> = {
    matched: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
    missing: "bg-rose-50 text-rose-800 ring-rose-600/20",
    partial: "bg-amber-50 text-amber-800 ring-amber-600/20",
    neutral: "bg-slate-100 text-slate-700 ring-slate-600/10",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${styles[variant]}`}
    >
      {skill}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "positive",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "positive" | "negative";
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="font-mono-tight text-4xl font-semibold text-slate-950">{value}</span>
      {hint && (
        <span className={`text-xs ${tone === "negative" ? "text-rose-700" : "text-emerald-700"}`}>
          {hint}
        </span>
      )}
    </Card>
  );
}
