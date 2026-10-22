import Link from "next/link";
import type { ReactNode } from "react";
import type { BudgetStatus } from "@/lib/budget";

/** Shared UI primitives. Keep feature-specific components in src/components/<feature>/. */

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const btnBase = "inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
export const buttonClasses = {
  primary: `${btnBase} bg-indigo-600 text-white hover:bg-indigo-700`,
  secondary: `${btnBase} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`,
  danger: `${btnBase} bg-rose-600 text-white hover:bg-rose-700`,
  ghost: `${btnBase} text-slate-700 hover:bg-slate-100`,
};

export const inputClasses =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
export const labelClasses = "block text-sm font-medium text-slate-700 mb-1";

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: keyof typeof buttonClasses }) {
  return (
    <Link href={href} className={buttonClasses[variant]}>
      {children}
    </Link>
  );
}

const badgeColors = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-800",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-rose-100 text-rose-800",
  indigo: "bg-indigo-100 text-indigo-800",
};
export function Badge({ children, color = "slate" }: { children: ReactNode; color?: keyof typeof badgeColors }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors[color]}`}>{children}</span>;
}

export function statusColor(status: BudgetStatus): "green" | "amber" | "red" {
  return status === "over" ? "red" : status === "warning" ? "amber" : "green";
}

/** Horizontal bar for budget utilization (0..n). */
export function ProgressBar({ value, status }: { value: number; status: BudgetStatus }) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(value) ? value * 100 : 100));
  const color = status === "over" ? "bg-rose-500" : status === "warning" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{children}</div>;
}

export function ComingSoon({ feature }: { feature: string }) {
  return <EmptyState>{feature} is being built.</EmptyState>;
}
