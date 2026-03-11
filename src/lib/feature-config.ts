// Feature translations and form field configs derived from Flask backend

export const FEATURE_TRANSLATIONS: Record<string, string> = {
  CREDIT_TO_INCOME_RATIO: "Debt-to-Income Burden",
  ANNUITY_TO_INCOME_RATIO: "Monthly Payment Burden",
  CREDIT_TO_GOODS_RATIO: "Loan-to-Collateral Ratio",
  ANNUITY_TO_CREDIT_RATIO: "Payment-to-Loan Ratio",
  CREDIT_TERM: "Effective Loan Term",
  INCOME_CREDIT_PERCENTAGE: "Income Coverage of Loan",
  PAYMENT_RATE: "Payment Rate",
  GOODS_CREDIT_DIFF: "Loan-Collateral Gap",
  INCOME_PER_ANNUITY: "Income per Payment",
  AMT_INCOME_TOTAL: "Annual Income",
  AMT_CREDIT: "Loan Amount",
  AMT_ANNUITY: "Monthly Payment",
  AMT_GOODS_PRICE: "Goods Price",
  EXT_SOURCE_1: "FICO Score",
  EXT_SOURCE_2: "Bureau / SCRA Score",
  EXT_SOURCE_3: "Internal Bank Score",
  EXT_SOURCE_MEAN: "Average Credit Score",
  EXT_SOURCE_MIN: "Lowest Credit Score",
  EXT_SOURCE_MAX: "Highest Credit Score",
  EXT_SOURCE_STD: "Credit Score Consistency",
  EXT_SOURCE_PROD: "Credit Score Product",
  EXT_SOURCE_WEIGHTED: "Weighted Credit Score",
  AGE_YEARS: "Applicant Age",
  YEARS_EMPLOYED: "Employment Tenure",
  EMPLOYMENT_TO_AGE_RATIO: "Employment-to-Age Ratio",
  CNT_CHILDREN: "Number of Dependents",
  CNT_FAM_MEMBERS: "Family Size",
  CODE_GENDER: "Gender",
  FLAG_OWN_CAR: "Owns Vehicle",
  FLAG_OWN_REALTY: "Owns Property",
  OWN_CAR_AGE: "Vehicle Age",
  NAME_CONTRACT_TYPE: "Contract Type",
  NAME_INCOME_TYPE: "Income Type",
  NAME_EDUCATION_TYPE: "Education Level",
  NAME_FAMILY_STATUS: "Family Status",
  NAME_HOUSING_TYPE: "Housing Type",
  OCCUPATION_TYPE: "Occupation",
  IS_YOUNG:              "Young Applicant (<30)",
  IS_UNEMPLOYED:         "Unemployment Flag",
  AGE_BUCKET:            "Age Group",
  EMPLOYMENT_TO_AGE:     "Employment-to-Age Ratio",
  DAYS_EMPLOYED_PERC:    "Employment Fraction of Life",
  EXT_STD:               "Credit Score Volatility",
  EXT_PROD:              "Credit Score Product",
  EXT_WEIGHTED:          "Weighted Credit Score",
  EXT2_x_INCOME:         "Credit Score × Income",
  EXT2_x_CREDIT:         "Credit Score × Loan Amount",
  EXT2_x_AGE:            "Credit Score × Age",
  BUREAU_LOAN_COUNT:     "Total Bureau Loans",
  BUREAU_ACTIVE_LOANS:   "Active Bureau Loans",
  BUREAU_CLOSED_LOANS:   "Closed Bureau Loans",
  BUREAU_AMT_CREDIT_SUM: "Total Bureau Credit",
  BUREAU_ACTIVE_RATIO:   "Bureau Active Loan Ratio",
  BUREAU_MAX_OVERDUE:    "Max Overdue Amount (Bureau)",
  BUREAU_DAYS_CREDIT_MAX:"Most Recent Bureau Credit",
  DTI:                   "Debt-to-Income Ratio (%)",
  TOTAL_ANNUITY:         "Total Monthly Obligations",
  CHILDREN_RATIO:        "Children-to-Family Ratio",
  INCOME_PER_PERSON:     "Income Per Family Member",
  TOTAL_CREDIT_REQS:     "Total Credit Bureau Enquiries",
  TOTAL_DOCS:            "Documents Submitted",
};

export interface FormField {
  name: string;
  label: string;
  type: "number" | "select" | "text";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  tooltip?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const FORM_SECTIONS: { title: string; icon: string; fields: FormField[] }[] = [
  {
    title: "Core Financials",
    icon: "💰",
    fields: [
      { name: "AMT_INCOME_TOTAL", label: "Annual Income ($)", type: "number", placeholder: "e.g. 75000", required: true, min: 0, step: 1000 },
      { name: "AMT_CREDIT", label: "Loan Amount ($)", type: "number", placeholder: "e.g. 250000", required: true, min: 0, step: 1000 },
      { name: "INTEREST_RATE", label: "Interest Rate (%)", type: "number", placeholder: "e.g. 5.5", min: 0, max: 30, step: 0.1 },
      { name: "TERM_MONTHS", label: "Loan Term (months)", type: "number", placeholder: "e.g. 360", min: 1, max: 600 },
      { name: "AMT_ANNUITY", label: "Monthly Payment ($)", type: "number", placeholder: "Auto-calculated or enter manually", min: 0 },
      { name: "AMT_GOODS_PRICE", label: "Goods / Collateral Price ($)", type: "number", placeholder: "e.g. 220000", min: 0, step: 1000 },
    ],
  },
  {
    title: "Applicant Profile",
    icon: "👤",
    fields: [
      { name: "AGE_YEARS", label: "Age (years)", type: "number", placeholder: "e.g. 35", required: true, min: 18, max: 100 },
      { name: "YEARS_EMPLOYED", label: "Years Employed", type: "number", placeholder: "e.g. 8", min: 0, max: 60, step: 0.5 },
      { name: "CODE_GENDER", label: "Gender", type: "select", options: [{ value: "M", label: "Male" }, { value: "F", label: "Female" }] },
      { name: "CNT_CHILDREN", label: "Number of Children", type: "number", placeholder: "0", min: 0, max: 20 },
      { name: "CNT_FAM_MEMBERS", label: "Family Members", type: "number", placeholder: "2", min: 1, max: 20 },
    ],
  },
  {
    title: "Credit Scores",
    icon: "📊",
    fields: [
      { name: "EXT_SOURCE_1", label: "FICO Score", type: "number", placeholder: "300–850 or 0–1", tooltip: "FICO credit score (300–850). Values 0–1 treated as normalized.", min: 0, max: 850, step: 1 },
      { name: "EXT_SOURCE_2", label: "Bureau / SCRA Score", type: "number", placeholder: "300–850 or 0–1", tooltip: "External bureau score (300–850). Values 0–1 treated as normalized.", min: 0, max: 850, step: 1 },
      { name: "EXT_SOURCE_3", label: "Internal Bank Score", type: "number", placeholder: "0–100 or 0–1", tooltip: "Internal bank score (0–100). Values 0–1 treated as normalized.", min: 0, max: 100, step: 1 },
    ],
  },
  {
    title: "Loan Details",
    icon: "📋",
    fields: [
      { name: "NAME_CONTRACT_TYPE", label: "Contract Type", type: "select", options: [{ value: "Cash loans", label: "Cash Loans" }, { value: "Revolving loans", label: "Revolving Loans" }] },
      { name: "FLAG_OWN_CAR", label: "Owns Car", type: "select", options: [{ value: "Y", label: "Yes" }, { value: "N", label: "No" }] },
      { name: "FLAG_OWN_REALTY", label: "Owns Property", type: "select", options: [{ value: "Y", label: "Yes" }, { value: "N", label: "No" }] },
      { name: "OWN_CAR_AGE", label: "Car Age (years)", type: "number", placeholder: "e.g. 5", min: 0, max: 60 },
    ],
  },
  {
    title: "Background",
    icon: "🏠",
    fields: [
      { name: "NAME_INCOME_TYPE", label: "Income Type", type: "select", options: [
        { value: "Working", label: "Working" }, { value: "Commercial associate", label: "Commercial Associate" },
        { value: "Pensioner", label: "Pensioner" }, { value: "State servant", label: "State Servant" },
        { value: "Student", label: "Student" },
      ]},
      { name: "NAME_EDUCATION_TYPE", label: "Education Level", type: "select", options: [
        { value: "Secondary / secondary special", label: "Secondary" }, { value: "Higher education", label: "Higher Education" },
        { value: "Incomplete higher", label: "Incomplete Higher" }, { value: "Lower secondary", label: "Lower Secondary" },
        { value: "Academic degree", label: "Academic Degree" },
      ]},
      { name: "NAME_FAMILY_STATUS", label: "Family Status", type: "select", options: [
        { value: "Married", label: "Married" }, { value: "Single / not married", label: "Single" },
        { value: "Civil marriage", label: "Civil Marriage" }, { value: "Separated", label: "Separated" },
        { value: "Widow", label: "Widow" },
      ]},
      { name: "NAME_HOUSING_TYPE", label: "Housing Type", type: "select", options: [
        { value: "House / apartment", label: "House / Apartment" }, { value: "Rented apartment", label: "Rented" },
        { value: "With parents", label: "With Parents" }, { value: "Municipal apartment", label: "Municipal" },
        { value: "Office apartment", label: "Office Apartment" }, { value: "Co-op apartment", label: "Co-op" },
      ]},
      { name: "OCCUPATION_TYPE", label: "Occupation", type: "select", options: [
        { value: "", label: "— Not specified —" },
        { value: "Laborers", label: "Laborers" }, { value: "Core staff", label: "Core Staff" },
        { value: "Accountants", label: "Accountants" }, { value: "Managers", label: "Managers" },
        { value: "Drivers", label: "Drivers" }, { value: "Sales staff", label: "Sales Staff" },
        { value: "Cleaning staff", label: "Cleaning Staff" }, { value: "Cooking staff", label: "Cooking Staff" },
        { value: "Medicine staff", label: "Medicine Staff" }, { value: "Security staff", label: "Security Staff" },
        { value: "IT staff", label: "IT Staff" }, { value: "HR staff", label: "HR Staff" },
      ]},
    ],
  },
];

export function calcAnnuity(principal: number, annualRatePct: number, months: number): number {
  if (!principal || principal <= 0 || !months || months <= 0) return 0;
  const r = (annualRatePct || 0) / 100 / 12;
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}
