import { describe, expect, it } from "vitest";
import { can, canSeeTask } from "@/lib/permissions";
import { wouldCreateCycle, computeBlockers } from "@/lib/schedule";

describe("permissions", () => {
  it("contractor is limited to assigned tasks", () => {
    expect(can("CONTRACTOR", "budget:view")).toBe(false);
    expect(can("CONTRACTOR", "tasks:updateAssigned")).toBe(true);
    expect(canSeeTask({ role: "CONTRACTOR", contractorId: "c1" }, { contractorId: "c1" })).toBe(true);
    expect(canSeeTask({ role: "CONTRACTOR", contractorId: "c1" }, { contractorId: "c2" })).toBe(false);
  });
  it("partner approves spending but cannot delete project", () => {
    expect(can("PARTNER", "expenses:approve")).toBe(true);
    expect(can("PARTNER", "project:delete")).toBe(false);
    expect(can("OWNER", "project:delete")).toBe(true);
  });
});

describe("schedule helpers", () => {
  it("detects cycles", () => {
    const deps = [{ taskId: "b", dependsOnId: "a" }, { taskId: "c", dependsOnId: "b" }];
    expect(wouldCreateCycle(deps, "a", "c")).toBe(true);
    expect(wouldCreateCycle(deps, "c", "a")).toBe(false);
  });
  it("lists unfinished prerequisites", () => {
    const tasks = [
      { id: "a", title: "Electrical", status: "IN_PROGRESS" },
      { id: "b", title: "Drywall", status: "NOT_STARTED" },
      { id: "c", title: "Demo", status: "DONE" },
    ];
    const m = computeBlockers(tasks, [{ taskId: "b", dependsOnId: "a" }, { taskId: "a", dependsOnId: "c" }]);
    expect(m.get("b")!.map((t) => t.id)).toEqual(["a"]);
    expect(m.has("a")).toBe(false);
  });
});

import { canApproveExpense, statusOnConfirm } from "@/lib/expenses";
describe("expense approval", () => {
  it("requires approval at/above threshold by someone else", () => {
    expect(statusOnConfirm(100000, 100000)).toBe("PENDING");
    expect(statusOnConfirm(99999, 100000)).toBe("APPROVED");
    expect(canApproveExpense({ createdById: "a", status: "PENDING" }, "a")).toBe(false);
    expect(canApproveExpense({ createdById: "a", status: "PENDING" }, "b")).toBe(true);
  });
});
