import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-3xl font-semibold tracking-tight">Renovation Planner</h1>
        <p className="mb-6 text-slate-600">Plan, budget and run your home renovation.</p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
