import { z } from "zod";

export const personalPrecheckSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("A valid email is required"),
  age: z.coerce.number().int().min(18, "You must be at least 18").max(75, "Age must be 75 or less"),
  monthlyIncome: z.coerce.number().positive("Monthly income must be greater than 0"),
  monthlyDebtPayments: z.coerce.number().min(0, "Debt payments cannot be negative"),
  monthlyLivingExpenses: z.coerce.number().min(0, "Expenses cannot be negative"),
  loanAmount: z.coerce.number().positive("Loan amount must be greater than 0"),
  loanTermMonths: z.coerce.number().int().min(6, "Minimum term is 6 months").max(360, "Maximum term is 360 months"),
  employmentStatus: z.enum(["full_time", "part_time", "self_employed", "unemployed", "student", "retired"]),
  yearsEmployed: z.coerce.number().min(0, "Years employed cannot be negative").max(50, "Years employed is too high"),
  priorDefaults: z.enum(["no", "yes"]),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must consent before running the pre-check" }),
  }),
});

export type PersonalPrecheckInput = z.infer<typeof personalPrecheckSchema>;

export type EligibilityBand = "Likely Approved" | "Borderline" | "Unlikely";

export type PersonalPrecheckResult = {
  score: number;
  band: EligibilityBand;
  reasons: string[];
  recommendations: string[];
};

export function mapScoreToBand(score: number): EligibilityBand {
  if (score >= 70) return "Likely Approved";
  if (score >= 45) return "Borderline";
  return "Unlikely";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateHeuristicScore(input: PersonalPrecheckInput): number {
  const annualIncome = input.monthlyIncome * 12;
  const annualDebt = (input.monthlyDebtPayments + input.monthlyLivingExpenses) * 12;
  const debtToIncome = annualIncome > 0 ? annualDebt / annualIncome : 1;
  const loanToIncome = annualIncome > 0 ? input.loanAmount / annualIncome : 1;

  const estimatedCreditScore = estimateCreditScore(input);

  let score = 50;
  score += (estimatedCreditScore - 600) * 0.08;
  score -= debtToIncome * 30;
  score -= loanToIncome * 18;

  if (input.priorDefaults === "yes") score -= 18;
  if (input.yearsEmployed >= 2) score += 6;
  if (input.employmentStatus === "full_time" || input.employmentStatus === "self_employed") score += 5;
  if (input.employmentStatus === "unemployed") score -= 14;
  if (input.loanTermMonths >= 120) score += 2;

  return clampScore(score);
}

function estimateCreditScore(input: PersonalPrecheckInput): number {
  let score = 650;

  if (input.priorDefaults === "yes") score -= 80;
  if (input.yearsEmployed >= 5) score += 30;
  else if (input.yearsEmployed >= 2) score += 15;
  else if (input.yearsEmployed < 1) score -= 20;

  if (input.employmentStatus === "full_time") score += 25;
  else if (input.employmentStatus === "self_employed") score += 15;
  else if (input.employmentStatus === "part_time") score += 5;
  else if (input.employmentStatus === "retired") score += 10;
  else if (input.employmentStatus === "student") score -= 10;
  else if (input.employmentStatus === "unemployed") score -= 50;

  const dti = input.monthlyIncome > 0 ? (input.monthlyDebtPayments + input.monthlyLivingExpenses) / input.monthlyIncome : 1;
  if (dti < 0.3) score += 20;
  else if (dti < 0.5) score += 5;
  else if (dti > 0.7) score -= 30;

  if (input.age >= 30 && input.age <= 55) score += 10;
  else if (input.age < 25) score -= 15;

  return Math.max(300, Math.min(850, score));
}

export function buildPrecheckFeedback(input: PersonalPrecheckInput, score: number): PersonalPrecheckResult {
  const annualIncome = input.monthlyIncome * 12;
  const debtToIncome = input.monthlyIncome > 0 ? (input.monthlyDebtPayments + input.monthlyLivingExpenses) / input.monthlyIncome : 1;
  const loanToIncome = annualIncome > 0 ? input.loanAmount / annualIncome : 1;
  const estimatedCreditScore = estimateCreditScore(input);

  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (debtToIncome > 0.6) {
    reasons.push("Your current debt and living expenses consume a high share of income.");
    recommendations.push("Lower monthly obligations and re-apply when debt-to-income is below 50%.");
  } else if (debtToIncome < 0.35) {
    reasons.push("Your debt-to-income profile is relatively healthy.");
  }

  if (loanToIncome > 0.8) {
    reasons.push("Requested loan amount is high relative to your annual income.");
    recommendations.push("Consider a smaller loan amount or a longer repayment horizon.");
  } else {
    reasons.push("Requested amount is proportionate to your income profile.");
  }

  if (estimatedCreditScore < 620) {
    reasons.push("Estimated credit profile is in a risk-sensitive range based on your financial history.");
    recommendations.push("Improve payment consistency and reduce card utilization to increase your score.");
  } else if (estimatedCreditScore >= 700) {
    reasons.push("Estimated credit profile supports stronger approval odds.");
  }

  if (input.priorDefaults === "yes") {
    reasons.push("Previous default history can reduce approval confidence.");
    recommendations.push("Provide additional proof of financial stability to offset prior defaults.");
  }

  if (input.yearsEmployed < 1) {
    recommendations.push("Build at least 12 months of stable employment history before re-checking.");
  }

  if (recommendations.length < 3) {
    recommendations.push("Avoid opening new credit lines before applying for a loan.");
  }
  if (recommendations.length < 3) {
    recommendations.push("Keep emergency savings equivalent to 3-6 months of expenses.");
  }

  return {
    score,
    band: mapScoreToBand(score),
    reasons: reasons.slice(0, 4),
    recommendations: recommendations.slice(0, 5),
  };
}
