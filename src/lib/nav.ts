import type { Capability } from "./permissions";

/** Sidebar navigation for a project. Items are hidden when the role lacks `cap`. */
export const PROJECT_NAV: { href: string; label: string; cap?: Capability }[] = [
  { href: "", label: "Overview" },
  { href: "/rooms", label: "Rooms", cap: "budget:view" },
  { href: "/tasks", label: "Task board" },
  { href: "/schedule", label: "Schedule", cap: "schedule:view" },
  { href: "/budget", label: "Budget", cap: "budget:view" },
  { href: "/expenses", label: "Expenses", cap: "budget:view" },
  { href: "/quotes", label: "Quotes", cap: "quotes:view" },
  { href: "/receipts", label: "Receipts", cap: "receipts:upload" },
  { href: "/team", label: "Team & sharing", cap: "team:view" },
];
