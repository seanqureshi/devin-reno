import { BUDGET_WARNING_THRESHOLD, CATEGORIES, CATEGORY_LABELS, type Category } from "./constants";
import { prisma } from "./db";

/**
 * Budget roll-up rules (single source of truth — use these everywhere):
 * - spent      = APPROVED expenses that are NOT paid from contingency.
 * - pending    = PENDING expenses (awaiting approval); informational only.
 * - committed  = for each AWARDED quote, the selected bid amount minus APPROVED
 *                expenses linked to that bid (floored at 0), counted against the
 *                quote's room + category. This is how a chosen bid "counts toward the budget".
 * - remaining  = budget - spent - committed
 * - utilization= (spent + committed) / budget
 * - status     = "over" if > 100%, "warning" if >= 90%, else "ok".
 * - Contingency: fund = project.contingencyCents; used = APPROVED expenses with fromContingency.
 */
export type BudgetStatus = "ok" | "warning" | "over";

export interface Amounts {
  budgetCents: number;
  spentCents: number;
  committedCents: number;
  pendingCents: number;
  remainingCents: number;
  utilization: number; // 0..n (Infinity if usage with zero budget)
  status: BudgetStatus;
}

export interface CategoryAmounts extends Amounts {
  category: Category;
  label: string;
}
export interface RoomAmounts extends Amounts {
  roomId: string;
  name: string;
  categories: CategoryAmounts[];
}
export interface BudgetWarning {
  scope: "room" | "category" | "roomCategory" | "contingency" | "project";
  label: string;
  roomId?: string;
  category?: Category;
  utilization: number;
  status: Exclude<BudgetStatus, "ok">;
}
export interface BudgetSummary {
  totals: Amounts;
  rooms: RoomAmounts[];
  categories: CategoryAmounts[];
  contingency: { fundCents: number; usedCents: number; remainingCents: number; utilization: number; status: BudgetStatus };
  warnings: BudgetWarning[];
}

export interface BudgetInput {
  contingencyCents: number;
  rooms: { id: string; name: string }[];
  budgetLines: { roomId: string; category: string; amountCents: number }[];
  expenses: {
    roomId: string | null;
    category: string;
    amountCents: number;
    status: string;
    fromContingency: boolean;
    bidId: string | null;
  }[];
  awardedBids: { bidId: string; roomId: string; category: string; amountCents: number }[];
}

export function statusFor(utilization: number): BudgetStatus {
  if (utilization > 1) return "over";
  if (utilization >= BUDGET_WARNING_THRESHOLD) return "warning";
  return "ok";
}

function finish(budgetCents: number, spentCents: number, committedCents: number, pendingCents: number): Amounts {
  const used = spentCents + committedCents;
  const utilization = budgetCents > 0 ? used / budgetCents : used > 0 ? Infinity : 0;
  return {
    budgetCents,
    spentCents,
    committedCents,
    pendingCents,
    remainingCents: budgetCents - used,
    utilization,
    status: statusFor(utilization),
  };
}

export function computeBudgetSummary(input: BudgetInput): BudgetSummary {
  type Acc = { budget: number; spent: number; committed: number; pending: number };
  const key = (roomId: string, cat: string) => `${roomId}::${cat}`;
  const cells = new Map<string, Acc>();
  const cell = (roomId: string, cat: string) => {
    const k = key(roomId, cat);
    let c = cells.get(k);
    if (!c) cells.set(k, (c = { budget: 0, spent: 0, committed: 0, pending: 0 }));
    return c;
  };
  const unassigned: Acc = { budget: 0, spent: 0, committed: 0, pending: 0 };

  for (const l of input.budgetLines) cell(l.roomId, l.category).budget += l.amountCents;

  let contingencyUsed = 0;
  const paidAgainstBid = new Map<string, number>();
  for (const e of input.expenses) {
    if (e.status === "APPROVED" && e.bidId) paidAgainstBid.set(e.bidId, (paidAgainstBid.get(e.bidId) ?? 0) + e.amountCents);
    if (e.status === "APPROVED" && e.fromContingency) {
      contingencyUsed += e.amountCents;
      continue;
    }
    const target = e.roomId ? cell(e.roomId, e.category) : unassigned;
    if (e.status === "APPROVED") target.spent += e.amountCents;
    else if (e.status === "PENDING") target.pending += e.amountCents;
  }
  for (const b of input.awardedBids) {
    const remaining = Math.max(0, b.amountCents - (paidAgainstBid.get(b.bidId) ?? 0));
    cell(b.roomId, b.category).committed += remaining;
  }

  const sum = (accs: Acc[]) =>
    accs.reduce(
      (a, c) => ({ budget: a.budget + c.budget, spent: a.spent + c.spent, committed: a.committed + c.committed, pending: a.pending + c.pending }),
      { budget: 0, spent: 0, committed: 0, pending: 0 },
    );
  const toAmounts = (a: Acc) => finish(a.budget, a.spent, a.committed, a.pending);

  const rooms: RoomAmounts[] = input.rooms.map((r) => {
    const cats = CATEGORIES.map((c) => ({ category: c, label: CATEGORY_LABELS[c], ...toAmounts(cells.get(key(r.id, c)) ?? { budget: 0, spent: 0, committed: 0, pending: 0 }) }));
    const roomAcc = sum(CATEGORIES.map((c) => cells.get(key(r.id, c)) ?? { budget: 0, spent: 0, committed: 0, pending: 0 }));
    return { roomId: r.id, name: r.name, categories: cats, ...toAmounts(roomAcc) };
  });

  const categories: CategoryAmounts[] = CATEGORIES.map((c) => {
    const acc = sum(input.rooms.map((r) => cells.get(key(r.id, c)) ?? { budget: 0, spent: 0, committed: 0, pending: 0 }));
    return { category: c, label: CATEGORY_LABELS[c], ...toAmounts(acc) };
  });

  const totalAcc = sum([...input.rooms.flatMap((r) => CATEGORIES.map((c) => cells.get(key(r.id, c)) ?? { budget: 0, spent: 0, committed: 0, pending: 0 })), unassigned]);
  const totals = toAmounts(totalAcc);

  const contingencyUtil = input.contingencyCents > 0 ? contingencyUsed / input.contingencyCents : contingencyUsed > 0 ? Infinity : 0;
  const contingency = {
    fundCents: input.contingencyCents,
    usedCents: contingencyUsed,
    remainingCents: input.contingencyCents - contingencyUsed,
    utilization: contingencyUtil,
    status: statusFor(contingencyUtil),
  };

  const warnings: BudgetWarning[] = [];
  const push = (w: Omit<BudgetWarning, "status">, status: BudgetStatus) => {
    if (status !== "ok") warnings.push({ ...w, status });
  };
  push({ scope: "project", label: "Total budget", utilization: totals.utilization }, totals.status);
  for (const r of rooms) {
    push({ scope: "room", label: r.name, roomId: r.roomId, utilization: r.utilization }, r.status);
    for (const c of r.categories)
      if (c.budgetCents > 0 || c.spentCents + c.committedCents > 0)
        push({ scope: "roomCategory", label: `${r.name} · ${c.label}`, roomId: r.roomId, category: c.category, utilization: c.utilization }, c.status);
  }
  for (const c of categories) push({ scope: "category", label: c.label, category: c.category, utilization: c.utilization }, c.status);
  push({ scope: "contingency", label: "Contingency fund", utilization: contingency.utilization }, contingency.status);
  warnings.sort((a, b) => b.utilization - a.utilization);

  return { totals, rooms, categories, contingency, warnings };
}

export async function loadBudgetInput(projectId: string): Promise<BudgetInput> {
  const [project, rooms, budgetLines, expenses, quotes] = await Promise.all([
    prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { contingencyCents: true } }),
    prisma.room.findMany({ where: { projectId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true } }),
    prisma.budgetLine.findMany({ where: { projectId } }),
    prisma.expense.findMany({ where: { projectId } }),
    prisma.quote.findMany({ where: { projectId, status: "AWARDED", selectedBidId: { not: null } }, include: { selectedBid: true } }),
  ]);
  return {
    contingencyCents: project.contingencyCents,
    rooms,
    budgetLines,
    expenses,
    awardedBids: quotes
      .filter((q) => q.selectedBid)
      .map((q) => ({ bidId: q.selectedBid!.id, roomId: q.roomId, category: q.category, amountCents: q.selectedBid!.amountCents })),
  };
}

export async function getBudgetSummary(projectId: string): Promise<BudgetSummary> {
  return computeBudgetSummary(await loadBudgetInput(projectId));
}
