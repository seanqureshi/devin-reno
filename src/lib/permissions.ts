import type { Role } from "./constants";

/**
 * Capability matrix. Owner: everything. Partner: co-owner, edits everything and
 * approves spending (cannot delete the project or remove the owner).
 * Contractor: only sees/updates tasks assigned to their contractor company.
 */
export const CAPABILITIES = [
  "project:edit",
  "project:delete",
  "rooms:edit",
  "tasks:viewAll",
  "tasks:edit", // create/delete/reassign/reorder any task
  "tasks:updateAssigned", // change status/notes on tasks assigned to me
  "budget:view",
  "budget:edit",
  "expenses:edit",
  "expenses:approve",
  "contingency:edit",
  "quotes:view",
  "quotes:edit",
  "receipts:upload",
  "schedule:view",
  "schedule:edit",
  "team:view",
  "team:manage",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

const ALL = new Set<Capability>(CAPABILITIES);
const PARTNER = new Set<Capability>(CAPABILITIES.filter((c) => c !== "project:delete"));
const CONTRACTOR = new Set<Capability>(["tasks:updateAssigned", "schedule:view"]);

export function can(role: Role | string | null | undefined, cap: Capability): boolean {
  switch (role) {
    case "OWNER":
      return ALL.has(cap);
    case "PARTNER":
      return PARTNER.has(cap);
    case "CONTRACTOR":
      return CONTRACTOR.has(cap);
    default:
      return false;
  }
}

/** Contractors only see tasks assigned to their company. */
export function canSeeTask(
  member: { role: string; contractorId: string | null },
  task: { contractorId: string | null },
): boolean {
  if (can(member.role, "tasks:viewAll")) return true;
  return member.role === "CONTRACTOR" && !!member.contractorId && task.contractorId === member.contractorId;
}
