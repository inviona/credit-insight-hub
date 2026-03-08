// Realistic mock data for development / demo mode

export interface HistoryRecord {
  id: string;
  created_at: string;
  amt_income: number;
  amt_credit: number;
  amt_annuity: number;
  age_years: number;
  raw_probability: number;
  adj_probability: number;
  decision: "APPROVED" | "REJECTED";
  risk_level: string;
  business_notes: string[];
}

export interface ShapFactor {
  feature: string;
  value: number;
  label: string;
}

export interface PredictionResult {
  raw_probability: number;
  adjusted_probability: number;
  risk_level: string;
  decision: "APPROVED" | "REJECTED";
  notes: string[];
  prepayment_risk: boolean;
  shap_info: {
    top_risk_factors: [string, number][];
    top_protect_factors: [string, number][];
  };
}

const decisions: ("APPROVED" | "REJECTED")[] = ["APPROVED", "REJECTED"];
const riskLevels = ["Low", "Moderate", "Elevated", "High"];

function randomDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 10) + 8);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

export function generateMockHistory(count = 25): HistoryRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const isApproved = Math.random() > 0.35;
    const rawProb = isApproved ? Math.random() * 0.5 : 0.5 + Math.random() * 0.45;
    const adjProb = Math.min(0.99, Math.max(0.01, rawProb + (Math.random() - 0.5) * 0.15));
    const riskIdx = adjProb < 0.15 ? 0 : adjProb < 0.3 ? 1 : adjProb < 0.5 ? 2 : 3;
    return {
      id: `app-${1000 + i}`,
      created_at: randomDate(30),
      amt_income: Math.round((40000 + Math.random() * 160000) / 1000) * 1000,
      amt_credit: Math.round((50000 + Math.random() * 950000) / 1000) * 1000,
      amt_annuity: Math.round(1000 + Math.random() * 4000),
      age_years: Math.round(22 + Math.random() * 43),
      raw_probability: Math.round(rawProb * 10000) / 10000,
      adj_probability: Math.round(adjProb * 10000) / 10000,
      decision: (isApproved ? "APPROVED" : "REJECTED") as const,
      risk_level: riskLevels[riskIdx],
      business_notes: isApproved
        ? ["Comfortable monthly DTI (18%) → −5% risk", "Owns property (collateral signal) → −3% risk"]
        : ["Very high monthly DTI (72%) → +22% risk", "Loan is 5.2× annual income (high) → +10% risk"],
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function generateMockPrediction(isApproved = true): PredictionResult {
  const rawProb = isApproved ? 0.28 : 0.72;
  const adjProb = isApproved ? 0.34 : 0.78;
  return {
    raw_probability: rawProb,
    adjusted_probability: adjProb,
    risk_level: isApproved ? "Moderate" : "High",
    decision: isApproved ? "APPROVED" : "REJECTED",
    prepayment_risk: false,
    notes: isApproved
      ? [
          "Comfortable monthly DTI (18%) → −5% risk",
          "Strong external credit score (avg 0.72) → −8% risk",
          "Owns property (collateral signal) → −3% risk",
        ]
      : [
          "Very high monthly DTI (68%) → +18% risk",
          "Loan is 5.8× annual income (very high) → +15% risk",
          "Weak external credit score (avg 0.22) → +10% risk",
          "3 dependent children on modest income → +5% risk",
        ],
    shap_info: {
      top_risk_factors: isApproved
        ? [
            ["Debt-to-Income Burden", 0.032],
            ["Loan Amount", 0.021],
            ["Employment Tenure", 0.018],
            ["Bureau Inquiries (Year)", 0.012],
          ]
        : [
            ["Debt-to-Income Burden", 0.142],
            ["Loan Amount", 0.098],
            ["Monthly Payment Burden", 0.076],
            ["Lowest Credit Score", 0.058],
            ["Employment Tenure", 0.043],
            ["Applicant Age", 0.032],
            ["Family Size", 0.021],
            ["Bureau Inquiries (Year)", 0.015],
          ],
      top_protect_factors: isApproved
        ? [
            ["Weighted Credit Score", -0.112],
            ["Bureau / SCRA Score", -0.087],
            ["FICO Score", -0.065],
            ["Annual Income", -0.043],
            ["Applicant Age", -0.032],
            ["Owns Property", -0.025],
            ["Employment-to-Age Ratio", -0.018],
            ["Income per Family Member", -0.012],
          ]
        : [
            ["Annual Income", -0.018],
            ["Owns Vehicle", -0.012],
          ],
    },
  };
}

export function generateDailyStats(days = 30) {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const approved = Math.floor(Math.random() * 8) + 2;
    const rejected = Math.floor(Math.random() * 5) + 1;
    data.push({
      date: d.toISOString().split("T")[0],
      approved,
      rejected,
    });
  }
  return data;
}
