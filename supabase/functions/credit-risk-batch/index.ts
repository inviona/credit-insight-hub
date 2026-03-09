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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
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

function computeRiskScore(row: {
  amt_income_total: number;
  amt_credit: number;
  amt_annuity: number;
  age_years: number | null;
  years_employed: number | null;
  ext_source_1: number | null;
  ext_source_2: number | null;
  ext_source_3: number | null;
}) {
  const income = row.amt_income_total;
  const credit = row.amt_credit;
  const annuity = row.amt_annuity;

  const ratio = credit / (income + 1);
  const annuityRatio = annuity / (income + 1);

  const extVals = [row.ext_source_1, row.ext_source_2, row.ext_source_3].filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  const extAvg = extVals.length ? extVals.reduce((a, b) => a + b, 0) / extVals.length : 650;
  const extNorm = clamp(extAvg / 1000, 0, 1);

  const age = row.age_years ?? 40;
  const yearsEmp = row.years_employed ?? 5;

  // Heuristic score (replace with your trained model later if you have an API/model artifact)
  const raw =
    1.25 * ratio +
    0.9 * annuityRatio -
    2.1 * extNorm +
    0.012 * (60 - age) -
    0.015 * yearsEmp;

  const scorePct = clamp(sigmoid(raw) * 100, 0, 100);
  const confidence = clamp(Math.abs(scorePct - 50) * 1.8, 5, 99);

  return { scorePct, confidence };
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

    const predictions = rows.map((r) => {
      const id = parseNumber(r.ID);
      const amt_income_total = parseNumber(r.AMT_INCOME_TOTAL) ?? 0;
      const amt_credit = parseNumber(r.AMT_CREDIT) ?? 0;
      const amt_annuity = parseNumber(r.AMT_ANNUITY) ?? 0;

      const age_years = parseNumber(r.AGE_YEARS);
      const years_employed = parseNumber(r.YEARS_EMPLOYED);
      const code_gender = (r.CODE_GENDER ?? "").trim() || null;

      const ext_source_1 = parseNumber(r.EXT_SOURCE_1);
      const ext_source_2 = parseNumber(r.EXT_SOURCE_2);
      const ext_source_3 = parseNumber(r.EXT_SOURCE_3);

      const { scorePct, confidence } = computeRiskScore({
        amt_income_total,
        amt_credit,
        amt_annuity,
        age_years,
        years_employed,
        ext_source_1,
        ext_source_2,
        ext_source_3,
      });

      const prediction_result = scorePct >= 50 ? "Rejected" : "Approved";

      return {
        id: id ?? null,
        amt_income_total,
        amt_credit,
        amt_annuity,
        age_years,
        years_employed,
        code_gender,
        ext_source_1,
        ext_source_2,
        ext_source_3,
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
