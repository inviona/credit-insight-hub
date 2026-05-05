import { describe, expect, it } from "vitest";
import {
  buildPrecheckFeedback,
  mapScoreToBand,
  personalPrecheckSchema,
} from "@/lib/personal-precheck-schema";

describe("personal precheck schema", () => {
  it("validates required consent", () => {
    const result = personalPrecheckSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      age: 30,
      monthlyIncome: 2000,
      monthlyDebtPayments: 300,
      monthlyLivingExpenses: 700,
      loanAmount: 5000,
      loanTermMonths: 36,
      employmentStatus: "full_time",
      yearsEmployed: 2,
      creditScore: 700,
      priorDefaults: "no",
      consentAccepted: false,
    });

    expect(result.success).toBe(false);
  });

  it("maps score to expected band", () => {
    expect(mapScoreToBand(75)).toBe("Likely Approved");
    expect(mapScoreToBand(55)).toBe("Borderline");
    expect(mapScoreToBand(30)).toBe("Unlikely");
  });

  it("generates recommendations for weak profile", () => {
    const feedback = buildPrecheckFeedback(
      {
        fullName: "Jane Doe",
        email: "jane@example.com",
        age: 24,
        monthlyIncome: 1000,
        monthlyDebtPayments: 500,
        monthlyLivingExpenses: 400,
        loanAmount: 15000,
        loanTermMonths: 24,
        employmentStatus: "part_time",
        yearsEmployed: 0.5,
        creditScore: 560,
        priorDefaults: "yes",
        consentAccepted: true,
      },
      28,
    );

    expect(feedback.band).toBe("Unlikely");
    expect(feedback.recommendations.length).toBeGreaterThanOrEqual(3);
    expect(feedback.reasons.length).toBeGreaterThan(0);
  });
});
