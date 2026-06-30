/*
 * api.js — thin wrapper around the Smart Farm backend.
 *
 * VITE_API_BASE is set per-environment (.env.local for dev, a Fly.io/
 * Railway env var in production) so the same frontend build can point
 * at different backend deployments without code changes.
 */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetchPrediction(sensors, fieldName) {
  const res = await fetch(`${API_BASE}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sensors, fieldName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Prediction request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchSimulatedSensors() {
  const res = await fetch(`${API_BASE}/api/simulate`);
  if (!res.ok) throw new Error(`Simulate request failed (${res.status})`);
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}
