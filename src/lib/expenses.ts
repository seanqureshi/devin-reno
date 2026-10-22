/**
 * Spending approval rule: an expense at/above the project's approvalThresholdCents needs
 * approval (PENDING) by a *different* member with "expenses:approve" (Owner or Partner);
 * smaller expenses are APPROVED immediately. DRAFT = not yet confirmed (e.g. from a receipt scan).
 */
export function statusOnConfirm(amountCents: number, approvalThresholdCents: number): "PENDING" | "APPROVED" {
  return amountCents >= approvalThresholdCents ? "PENDING" : "APPROVED";
}

export function canApproveExpense(expense: { createdById: string; status: string }, approverUserId: string): boolean {
  return expense.status === "PENDING" && expense.createdById !== approverUserId;
}
