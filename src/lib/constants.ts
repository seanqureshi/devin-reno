export const ROLES = ["OWNER", "PARTNER", "CONTRACTOR"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  PARTNER: "Partner",
  CONTRACTOR: "Contractor",
};

export const TASK_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

export const CATEGORIES = ["LABOR", "MATERIALS", "FIXTURES", "PERMITS"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
  LABOR: "Labor",
  MATERIALS: "Materials",
  FIXTURES: "Fixtures",
  PERMITS: "Permits",
};

export const EXPENSE_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED"] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const QUOTE_STATUSES = ["OPEN", "AWARDED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export const BID_STATUSES = ["SUBMITTED", "ACCEPTED", "REJECTED"] as const;
export type BidStatus = (typeof BID_STATUSES)[number];
export const INVITE_STATUSES = ["PENDING", "ACCEPTED", "REVOKED"] as const;

/** Utilization at/above this fraction triggers a budget warning. */
export const BUDGET_WARNING_THRESHOLD = 0.9;
