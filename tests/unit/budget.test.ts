import { describe, expect, it } from "vitest";
import { computeBudgetSummary, statusFor } from "@/lib/budget";

describe("computeBudgetSummary", () => {
  const base = {
    contingencyCents: 1000_00,
    rooms: [{ id: "k", name: "Kitchen" }],
    budgetLines: [
      { roomId: "k", category: "LABOR", amountCents: 1000_00 },
      { roomId: "k", category: "FIXTURES", amountCents: 500_00 },
    ],
  };

  it("rolls up approved expenses, ignores drafts, tracks pending", () => {
    const s = computeBudgetSummary({
      ...base,
      expenses: [
        { roomId: "k", category: "LABOR", amountCents: 300_00, status: "APPROVED", fromContingency: false, bidId: null },
        { roomId: "k", category: "LABOR", amountCents: 50_00, status: "DRAFT", fromContingency: false, bidId: null },
        { roomId: "k", category: "FIXTURES", amountCents: 20_00, status: "PENDING", fromContingency: false, bidId: null },
      ],
      awardedBids: [],
    });
    expect(s.totals.spentCents).toBe(300_00);
    expect(s.totals.pendingCents).toBe(20_00);
    expect(s.totals.remainingCents).toBe(1200_00);
    expect(s.rooms[0].categories.find((c) => c.category === "LABOR")!.spentCents).toBe(300_00);
  });

  it("counts awarded bids as committed minus payments against them", () => {
    const s = computeBudgetSummary({
      ...base,
      expenses: [{ roomId: "k", category: "LABOR", amountCents: 400_00, status: "APPROVED", fromContingency: false, bidId: "b1" }],
      awardedBids: [{ bidId: "b1", roomId: "k", category: "LABOR", amountCents: 950_00 }],
    });
    const labor = s.categories.find((c) => c.category === "LABOR")!;
    expect(labor.spentCents).toBe(400_00);
    expect(labor.committedCents).toBe(550_00);
    expect(labor.utilization).toBeCloseTo(0.95);
    expect(labor.status).toBe("warning");
    expect(s.warnings.some((w) => w.scope === "category" && w.category === "LABOR")).toBe(true);
  });

  it("charges contingency expenses to the contingency fund", () => {
    const s = computeBudgetSummary({
      ...base,
      expenses: [{ roomId: "k", category: "MATERIALS", amountCents: 950_00, status: "APPROVED", fromContingency: true, bidId: null }],
      awardedBids: [],
    });
    expect(s.totals.spentCents).toBe(0);
    expect(s.contingency.usedCents).toBe(950_00);
    expect(s.contingency.status).toBe("warning");
  });

  it("statusFor thresholds", () => {
    expect(statusFor(0.89)).toBe("ok");
    expect(statusFor(0.9)).toBe("warning");
    expect(statusFor(1)).toBe("warning");
    expect(statusFor(1.01)).toBe("over");
  });
});
