import { supabase } from "@/integrations/supabase/client";

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
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/api/batch", { method: "POST", body: form });
  if (!res.ok) throw new Error("Batch prediction failed");
  return res;
}

export async function healthCheck() {
  const res = await apiFetch("/health");
  return res.json();
}
