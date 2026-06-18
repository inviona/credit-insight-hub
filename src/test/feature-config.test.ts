import { describe, expect, it } from "vitest";
import { calcAnnuity, FEATURE_TRANSLATIONS } from "@/lib/feature-config";

describe("calcAnnuity", () => {
  it("computes monthly payment correctly", () => {
    const result = calcAnnuity(200000, 5, 360);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(200000);
  });

  it("returns 0 for zero principal", () => {
    expect(calcAnnuity(0, 5, 360)).toBe(0);
  });

  it("returns 0 for negative principal", () => {
    expect(calcAnnuity(-100, 5, 360)).toBe(0);
  });

  it("returns 0 for zero months", () => {
    expect(calcAnnuity(200000, 5, 0)).toBe(0);
  });

  it("handles zero interest rate", () => {
    expect(calcAnnuity(12000, 0, 12)).toBe(1000);
  });

  it("handles very small principal", () => {
    expect(calcAnnuity(1, 5, 12)).toBeGreaterThan(0);
  });

  it("handles large principal and rate", () => {
    const result = calcAnnuity(1_000_000, 10, 360);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1_000_000);
  });

  it("returns consistent result for same inputs", () => {
    const a = calcAnnuity(150000, 4.5, 180);
    const b = calcAnnuity(150000, 4.5, 180);
    expect(a).toBe(b);
  });
});

describe("FEATURE_TRANSLATIONS", () => {
  it("contains expected keys", () => {
    expect(FEATURE_TRANSLATIONS["AMT_INCOME_TOTAL"]).toBe("Annual Income");
    expect(FEATURE_TRANSLATIONS["AMT_CREDIT"]).toBe("Loan Amount");
    expect(FEATURE_TRANSLATIONS["CODE_GENDER"]).toBe("Gender");
  });

  it("has string values for all entries", () => {
    for (const val of Object.values(FEATURE_TRANSLATIONS)) {
      expect(typeof val).toBe("string");
    }
  });
});
