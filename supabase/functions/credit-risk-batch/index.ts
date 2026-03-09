// Lovable Cloud backend function: credit-risk-batch
// Accepts CSV text and proxies to external Python XGBoost API
// Expects PREDICTION_API_URL environment variable

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseCsvSimple(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) row[header[i]] = (values[i] ?? "").trim();
    return row;
  });
}

async function callPredictionAPI(applicants: any[]): Promise<any[]> {
  const PREDICTION_API_URL = Deno.env.get("PREDICTION_API_URL");
  
  if (!PREDICTION_API_URL) {
    throw new Error("PREDICTION_API_URL not configured. Please set this secret to your deployed Python API URL.");
  }

  const response = await fetch(`${PREDICTION_API_URL}/predict/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicants, threshold: 0.5 }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Python API error [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get("content-type") ?? "";

    let csvText = "";
    if (contentType.includes("text/csv") || contentType.includes("application/octet-stream") || !contentType) {
      csvText = await req.text();
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      csvText = String(body?.csv ?? "");
    } else {
      return new Response(JSON.stringify({ error: "Unsupported content-type" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = parseCsvSimple(csvText);
    if (!rows.length) {
      return new Response(JSON.stringify({ error: "CSV is empty or invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const required = ["ID", "AMT_INCOME_TOTAL", "AMT_CREDIT", "AMT_ANNUITY"];
    const missing = required.filter((k) => !(k in rows[0]));
    if (missing.length) {
      return new Response(
        JSON.stringify({ error: `Missing required columns: ${missing.join(", ")}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prepare applicants for Python API call
    const applicants = rows.map((r) => ({
      ID: parseNumber(r.ID),
      AMT_INCOME_TOTAL: parseNumber(r.AMT_INCOME_TOTAL) ?? 0,
      AMT_CREDIT: parseNumber(r.AMT_CREDIT) ?? 0,
      AMT_ANNUITY: parseNumber(r.AMT_ANNUITY) ?? 0,
      AGE_YEARS: parseNumber(r.AGE_YEARS),
      YEARS_EMPLOYED: parseNumber(r.YEARS_EMPLOYED),
      CODE_GENDER: (r.CODE_GENDER ?? "").trim() || null,
      EXT_SOURCE_1: parseNumber(r.EXT_SOURCE_1),
      EXT_SOURCE_2: parseNumber(r.EXT_SOURCE_2),
      EXT_SOURCE_3: parseNumber(r.EXT_SOURCE_3),
    }));

    // Call external Python XGBoost API
    const apiResults = await callPredictionAPI(applicants);

    // Map API results to database format
    const predictions = applicants.map((app, idx) => {
      const apiResult = apiResults[idx];
      
      // Convert API response to our format
      const scorePct = (apiResult.risk_probability ?? 0) * 100;
      const prediction_result = apiResult.decision === "DEFAULT" ? "Rejected" : "Approved";
      
      // Estimate confidence from risk tier
      let confidence = 85;
      if (apiResult.risk_tier === "VERY LOW" || apiResult.risk_tier === "HIGH") confidence = 95;
      else if (apiResult.risk_tier === "LOW" || apiResult.risk_tier === "ELEVATED") confidence = 80;
      else confidence = 70;

      return {
        id: app.ID,
        amt_income_total: app.AMT_INCOME_TOTAL,
        amt_credit: app.AMT_CREDIT,
        amt_annuity: app.AMT_ANNUITY,
        age_years: app.AGE_YEARS,
        years_employed: app.YEARS_EMPLOYED,
        code_gender: app.CODE_GENDER,
        ext_source_1: app.EXT_SOURCE_1,
        ext_source_2: app.EXT_SOURCE_2,
        ext_source_3: app.EXT_SOURCE_3,
        default_risk_score: scorePct,
        confidence_level: confidence,
        prediction_result,
      };
    });

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Failed to process batch" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
