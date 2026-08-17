import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import CreateJobForm from "@/components/CreateJobForm";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "recruiter") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-3xl font-medium text-slate-950">Create a job</h1>
        <p className="mt-1 text-slate-500">
          We&apos;ll automatically extract required/preferred skills, experience, and education from
          the description.
        </p>
        <Card className="mt-6">
          <CreateJobForm />
        </Card>
      </main>
    </div>
  );
}
