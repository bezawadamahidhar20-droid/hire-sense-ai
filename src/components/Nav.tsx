import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export default async function Nav() {
  const user = await getCurrentUser();

  const candidateLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resumes", label: "My Resumes" },
    { href: "/matches", label: "Job Matches" },
  ];
  const recruiterLinks = [
    { href: "/recruiter", label: "Dashboard" },
    { href: "/recruiter/jobs/new", label: "New Job" },
  ];

  const links = !user ? [] : user.role === "recruiter" ? recruiterLinks : candidateLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600 text-sm font-bold text-white">
            H
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-slate-950">
            HireSense AI
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user.name} · <span className="capitalize">{user.role}</span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
              >
                Sign in
              </Link>
              <Link
                href="/signup?role=candidate"
                className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
