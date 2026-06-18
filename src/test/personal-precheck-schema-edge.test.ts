import { describe, expect, it } from "vitest";
import {
  buildPrecheckFeedback,
  calculateHeuristicScore,
  mapScoreToBand,
  personalPrecheckSchema,
} from "@/lib/personal-precheck-schema";

describe("personalPrecheckSchema edge cases", () => {
  it("rejects underage applicant", () => {
    const result = personalPrecheckSchema.safeParse({
      fullName: "Test",
      email: "t@t.com",
      age: 17,
      monthlyIncome: 2000,
      monthlyDebtPayments: 0,
      monthlyLivingExpenses: 500,
      loanAmount: 5000,
      loanTermMonths: 12,
      employmentStatus: "full_time",
      yearsEmployed: 2,
      priorDefaults: "no",
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects age over 75", () => {
    const result = personalPrecheckSchema.safeParse({
      fullName: "Test",
      email: "t@t.com",
      age: 80,
      monthlyIncome: 2000,
      monthlyDebtPayments: 0,
      monthlyLivingExpenses: 500,
      loanAmount: 5000,
      loanTermMonths: 12,
      employmentStatus: "full_time",
      yearsEmployed: 2,
      priorDefaults: "no",
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative loan amount", () => {
    const result = personalPrecheckSchema.safeParse({
      fullName: "Test",
      email: "t@t.com",
      age: 30,
      monthlyIncome: 5000,
      monthlyDebtPayments: 0,
      monthlyLivingExpenses: 1000,
      loanAmount: -500,
      loanTermMonths: 12,
      employmentStatus: "full_time",
      yearsEmployed: 5,
      priorDefaults: "no",
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = personalPrecheckSchema.safeParse({
      fullName: "Test",
      email: "not-an-email",
      age: 30,
      monthlyIncome: 5000,
      monthlyDebtPayments: 0,
      monthlyLivingExpenses: 1000,
      loanAmount: 10000,
      loanTermMonths: 12,
      employmentStatus: "full_time",
      yearsEmployed: 5,
      priorDefaults: "no",
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects short loan term", () => {
    const result = personalPrecheckSchema.safeParse({
      fullName: "Test",
      email: "t@t.com",
      age: 30,
      monthlyIncome: 5000,
      monthlyDebtPayments: 0,
      monthlyLivingExpenses: 1000,
      loanAmount: 10000,
      loanTermMonths: 3,
      employmentStatus: "full_time",
      yearsEmployed: 5,
      priorDefaults: "no",
      consentAccepted: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("calculateHeuristicScore", () => {
  const base = {
    fullName: "Test",
    email: "t@t.com",
    age: 35,
    monthlyIncome: 5000,
    monthlyDebtPayments: 500,
    monthlyLivingExpenses: 1000,
    loanAmount: 30000,
    loanTermMonths: 48,
    employmentStatus: "full_time" as const,
    yearsEmployed: 5,
    priorDefaults: "no" as const,
    consentAccepted: true,
  };

  it("returns a score between 0 and 100", () => {
    const score = calculateHeuristicScore(base);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("penalizes prior defaults", () => {
    const withDefault = calculateHeuristicScore({ ...base, priorDefaults: "yes" });
    const withoutDefault = calculateHeuristicScore(base);
    expect(withDefault).toBeLessThan(withoutDefault);
  });

  it("rewards longer employment", () => {
    const longEmployed = calculateHeuristicScore({ ...base, yearsEmployed: 10 });
    const shortEmployed = calculateHeuristicScore({ ...base, yearsEmployed: 1 });
    expect(longEmployed).toBeGreaterThan(shortEmployed);
  });

  it("penalizes unemployment", () => {
    const unemployed = calculateHeuristicScore({ ...base, employmentStatus: "unemployed" });
    const employed = calculateHeuristicScore(base);
    expect(unemployed).toBeLessThan(employed);
  });

  it("handles zero income gracefully", () => {
    const score = calculateHeuristicScore({ ...base, monthlyIncome: 0 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("mapScoreToBand", () => {
  it("returns Likely Approved for score >= 70", () => {
    expect(mapScoreToBand(70)).toBe("Likely Approved");
    expect(mapScoreToBand(100)).toBe("Likely Approved");
  });

  it("returns Borderline for 45-69", () => {
    expect(mapScoreToBand(45)).toBe("Borderline");
    expect(mapScoreToBand(60)).toBe("Borderline");
    expect(mapScoreToBand(69)).toBe("Borderline");
  });

  it("returns Unlikely for score < 45", () => {
    expect(mapScoreToBand(44)).toBe("Unlikely");
    expect(mapScoreToBand(0)).toBe("Unlikely");
  });
});

describe("buildPrecheckFeedback", () => {
  it("includes recommendations for weak profiles", () => {
    const feedback = buildPrecheckFeedback(
      {
        fullName: "Weak",
        email: "w@w.com",
        age: 22,
        monthlyIncome: 1500,
        monthlyDebtPayments: 800,
        monthlyLivingExpenses: 600,
        loanAmount: 50000,
        loanTermMonths: 12,
        employmentStatus: "unemployed",
        yearsEmployed: 0,
        priorDefaults: "yes",
        consentAccepted: true,
      },
      15,
    );
    expect(feedback.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  it("has at least some reasons for any profile", () => {
    const feedback = buildPrecheckFeedback(
      {
        fullName: "Strong",
        email: "s@s.com",
        age: 45,
        monthlyIncome: 10000,
        monthlyDebtPayments: 500,
        monthlyLivingExpenses: 1000,
        loanAmount: 20000,
        loanTermMonths: 60,
        employmentStatus: "full_time",
        yearsEmployed: 10,
        priorDefaults: "no",
        consentAccepted: true,
      },
      85,
    );
    expect(feedback.reasons.length).toBeGreaterThan(0);
  });

  it("limits reasons to 4 and recommendations to 5", () => {
    const feedback = buildPrecheckFeedback(
      {
        fullName: "Test",
        email: "t@t.com",
        age: 30,
        monthlyIncome: 2000,
        monthlyDebtPayments: 1000,
        monthlyLivingExpenses: 800,
        loanAmount: 100000,
        loanTermMonths: 12,
        employmentStatus: "part_time",
        yearsEmployed: 0.5,
        priorDefaults: "yes",
        consentAccepted: true,
      },
      20,
    );
    expect(feedback.reasons.length).toBeLessThanOrEqual(4);
    expect(feedback.recommendations.length).toBeLessThanOrEqual(5);
  });
});
