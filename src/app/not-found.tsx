import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-slate-600">That page doesn&apos;t exist or you don&apos;t have access.</p>
      <Link href="/projects" className="mt-4 inline-block text-indigo-700 underline">Back to projects</Link>
    </main>
  );
}
