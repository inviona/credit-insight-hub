import { supabase } from "@/integrations/supabase/client";
import {
  buildPrecheckFeedback,
  calculateHeuristicScore,
  personalPrecheckSchema,
  type PersonalPrecheckInput,
  type PersonalPrecheckResult,
} from "@/lib/personal-precheck-schema";

// API helper — legacy endpoints can point to an external Flask backend via VITE_API_URL.
// Batch prediction uses a Lovable Cloud backend function by default.
const BASE = import.meta.env.VITE_API_URL ?? "";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
  });
  return res;
}

export async function login(username: string, password: string) {
  const form = new FormData();
  form.append("username", username);
  form.append("password", password);
  return apiFetch("/login", { method: "POST", body: form });
}

export async function register(username: string, email: string, password: string) {
  const form = new FormData();
  form.append("username", username);
  form.append("email", email);
  form.append("password", password);
  return apiFetch("/register", { method: "POST", body: form });
}

export async function logout() {
  return apiFetch("/logout");
}

export async function fetchHistory() {
  const res = await apiFetch("/api/history");
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function submitPrediction(data: Record<string, string>) {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => form.append(k, v));
  const res = await apiFetch("/api/predict", { method: "POST", body: form });
  if (!res.ok) throw new Error("Prediction failed");
  return res.text(); // returns HTML partial from Flask
}

export async function submitBatch(file: File) {
  const csvText = await file.text();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  // Calls Lovable Cloud backend function (avoids the missing /api/batch Flask route)
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/credit-risk-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "text/csv",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: csvText,
  });
}

export async function healthCheck() {
  const res = await apiFetch("/health");
  return res.json();
}

function normalizeEdgeScore(edgeData: unknown): number | null {
  if (!edgeData || typeof edgeData !== "object") return null;
  const scoreCandidate =
    (edgeData as { score?: unknown }).score ??
    (edgeData as { probability?: unknown }).probability ??
    (edgeData as { approval_score?: unknown }).approval_score;
  if (typeof scoreCandidate === "number" && Number.isFinite(scoreCandidate)) {
    return scoreCandidate <= 1 ? Math.round(scoreCandidate * 100) : Math.round(scoreCandidate);
  }
  return null;
}

export async function runPersonalPrecheck(rawInput: unknown): Promise<{
  parsedInput: PersonalPrecheckInput;
  result: PersonalPrecheckResult;
}> {
  const parsedInput = personalPrecheckSchema.parse(rawInput);
  const score = calculateHeuristicScore(parsedInput);

  return {
    parsedInput,
    result: buildPrecheckFeedback(parsedInput, score),
  };
}
