"use client";

import { useState } from "react";
import { buttonClasses, inputClasses, labelClasses } from "@/components/ui";

const DEMO_USERS = [
  { email: "owner@example.com", label: "Alex Rivera", role: "Owner" },
  { email: "partner@example.com", label: "Jordan Rivera", role: "Partner" },
  { email: "mike@brightline-electric.example", label: "Mike Chen (Brightline Electric)", role: "Contractor" },
  { email: "sara@summit-plumbing.example", label: "Sara Lopez (Summit Plumbing)", role: "Contractor" },
];
export const DEMO_PASSWORD = "password123";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e: string, p: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: e, password: p }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Login failed");
      return;
    }
    window.location.href = next && next.startsWith("/") ? next : "/projects";
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={(ev) => {
          ev.preventDefault();
          login(email, password);
        }}
      >
        <div>
          <label className={labelClasses} htmlFor="email">Email</label>
          <input id="email" type="email" className={inputClasses} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className={labelClasses} htmlFor="password">Password</label>
          <input id="password" type="password" className={inputClasses} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
        <button type="submit" className={`${buttonClasses.primary} w-full`} disabled={busy}>Sign in</button>
      </form>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-medium text-slate-700">Demo accounts (password: {DEMO_PASSWORD})</p>
        <div className="grid gap-2">
          {DEMO_USERS.map((u) => (
            <button key={u.email} type="button" className={`${buttonClasses.secondary} justify-between`} disabled={busy} onClick={() => login(u.email, DEMO_PASSWORD)}>
              <span>{u.label}</span>
              <span className="text-xs text-slate-500">{u.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
