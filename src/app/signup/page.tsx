import { Suspense } from "react";
import Nav from "@/components/Nav";
import { SignupForm } from "@/components/AuthForms";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-medium text-slate-950">Create your account</h1>
          <p className="mt-1 mb-6 text-sm text-slate-500">
            Get explainable match scores in minutes.
          </p>
          <Suspense>
            <SignupForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
