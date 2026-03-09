// Lovable Cloud backend function: credit-risk-single
// Accepts single applicant data and proxies to external Python XGBoost API
// Expects PREDICTION_API_URL environment variable

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PredictionRequest {
  AMT_INCOME_TOTAL: number;
  AMT_CREDIT: number;
  AMT_ANNUITY: number;
  AMT_GOODS_PRICE?: number;
  AGE_YEARS?: number;
  YEARS_EMPLOYED?: number;
  CODE_GENDER?: string;
  EXT_SOURCE_1?: number;
  EXT_SOURCE_2?: number;
  EXT_SOURCE_3?: number;
  CNT_CHILDREN?: number;
  CNT_FAM_MEMBERS?: number;
  OCCUPATION_TYPE?: string;
  NAME_EDUCATION_TYPE?: string;
  NAME_INCOME_TYPE?: string;
  ORGANIZATION_TYPE?: string;
  REGION_RATING_CLIENT?: number;
}

interface PythonAPIResponse {
  risk_probability: number;
  risk_percentage: number;
  decision: string;
  risk_tier: string;
  policy: string;
  shap_values?: {
    top_risk_factors: [string, number][];
    top_protect_factors: [string, number][];
  };
}

async function callPredictionAPI(applicant: PredictionRequest): Promise<PythonAPIResponse> {
  const rawBase = Deno.env.get("PREDICTION_API_URL")?.trim();

  if (!rawBase) {
    throw new Error(
      "PREDICTION_API_URL not configured. Please set this secret to your deployed Python API base URL (e.g. https://your-app.onrender.com)."
    );
  }

  if (rawBase === "PREDICTION_API_URL") {
    throw new Error(
      "PREDICTION_API_URL is set to a placeholder value; please update it to a real URL (e.g. https://your-app.onrender.com)."
    );
  }

  // Be forgiving if user pastes a hostname without scheme
  const normalizedBase = /^https?:\/\//i.test(rawBase) ? rawBase : `https://${rawBase}`;

  let endpoint: string;
  try {
    endpoint = new URL("/predict", normalizedBase).toString();
  } catch {
    throw new Error(
      "PREDICTION_API_URL is not a valid URL; it must include a valid host and (optionally) a scheme like https://."
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...applicant, threshold: 0.5 }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Python API error [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    
    // Extract and clean form data
    const applicant: PredictionRequest = {
      AMT_INCOME_TOTAL: parseNumber(body.AMT_INCOME_TOTAL) ?? 0,
      AMT_CREDIT: parseNumber(body.AMT_CREDIT) ?? 0,
      AMT_ANNUITY: parseNumber(body.AMT_ANNUITY) ?? 0,
    };

    // Add optional fields if present
    if (body.AMT_GOODS_PRICE) applicant.AMT_GOODS_PRICE = parseNumber(body.AMT_GOODS_PRICE);
    if (body.AGE_YEARS) applicant.AGE_YEARS = parseNumber(body.AGE_YEARS);
    if (body.YEARS_EMPLOYED) applicant.YEARS_EMPLOYED = parseNumber(body.YEARS_EMPLOYED);
    if (body.CODE_GENDER) applicant.CODE_GENDER = String(body.CODE_GENDER);
    if (body.EXT_SOURCE_1) applicant.EXT_SOURCE_1 = parseNumber(body.EXT_SOURCE_1);
    if (body.EXT_SOURCE_2) applicant.EXT_SOURCE_2 = parseNumber(body.EXT_SOURCE_2);
    if (body.EXT_SOURCE_3) applicant.EXT_SOURCE_3 = parseNumber(body.EXT_SOURCE_3);
    if (body.CNT_CHILDREN) applicant.CNT_CHILDREN = parseNumber(body.CNT_CHILDREN);
    if (body.CNT_FAM_MEMBERS) applicant.CNT_FAM_MEMBERS = parseNumber(body.CNT_FAM_MEMBERS);
    if (body.OCCUPATION_TYPE) applicant.OCCUPATION_TYPE = String(body.OCCUPATION_TYPE);
    if (body.NAME_EDUCATION_TYPE) applicant.NAME_EDUCATION_TYPE = String(body.NAME_EDUCATION_TYPE);
    if (body.NAME_INCOME_TYPE) applicant.NAME_INCOME_TYPE = String(body.NAME_INCOME_TYPE);
    if (body.ORGANIZATION_TYPE) applicant.ORGANIZATION_TYPE = String(body.ORGANIZATION_TYPE);
    if (body.REGION_RATING_CLIENT) applicant.REGION_RATING_CLIENT = parseNumber(body.REGION_RATING_CLIENT);

    // Call external Python XGBoost API
    const apiResult = await callPredictionAPI(applicant);

    // Transform response for frontend
    const result = {
      raw_probability: apiResult.risk_probability,
      adjusted_probability: apiResult.risk_probability,
      risk_level: apiResult.risk_tier,
      decision: apiResult.decision === "DEFAULT" ? "REJECTED" : "APPROVED",
      notes: [apiResult.policy],
      prepayment_risk: false,
      shap_info: apiResult.shap_values || {
        top_risk_factors: [],
        top_protect_factors: [],
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Credit risk single prediction error:", e);
    return new Response(
      JSON.stringify({ 
        error: e instanceof Error ? e.message : "Failed to process prediction"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
