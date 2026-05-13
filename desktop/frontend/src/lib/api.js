const API_BASE = window.desktopAPI?.backendUrl || "http://127.0.0.1:8765";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || `HTTP ${response.status}`);
  }
  return data;
}

export async function getHealth() {
  return parseResponse(await fetch(`${API_BASE}/api/health`));
}

export async function getEnv() {
  return parseResponse(await fetch(`${API_BASE}/api/env`));
}

export async function getProjectStatus() {
  return parseResponse(await fetch(`${API_BASE}/api/project-status`));
}

export async function getLogs() {
  return parseResponse(await fetch(`${API_BASE}/api/logs`));
}

export async function getResults() {
  return parseResponse(await fetch(`${API_BASE}/api/results`));
}

export async function startColorize(payload) {
  return parseResponse(
    await fetch(`${API_BASE}/api/colorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
  );
}

export async function cleanOutputs() {
  return parseResponse(
    await fetch(`${API_BASE}/api/clean-outputs`, {
      method: "POST"
    })
  );
}

export async function openFolder(target) {
  return parseResponse(
    await fetch(`${API_BASE}/api/open-folder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target })
    })
  );
}

export { API_BASE };
