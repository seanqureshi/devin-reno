"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectNav({ projectId, items }: { projectId: string; items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Project">
      {items.map((item) => {
        const href = `${base}${item.href}`;
        const active = item.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={item.href}
            href={href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
