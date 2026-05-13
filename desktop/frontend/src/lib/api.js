const API_BASE = window.mangaAPI?.backendUrl || "http://127.0.0.1:8765";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || `HTTP ${response.status}`);
  }
  return data;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  return parseResponse(response);
}

export async function getHealth() {
  return requestJson("/api/health");
}

export async function getEnv() {
  return requestJson("/api/env");
}

export async function getProjectStatus() {
  return requestJson("/api/project-status");
}

export async function getLogs() {
  return requestJson("/api/logs");
}

export async function getResults() {
  return requestJson("/api/results");
}

export async function getJobStatus() {
  return requestJson("/api/job-status");
}

export async function getLibraryJobStatus() {
  return requestJson("/api/library/job-status");
}

export async function startColorize(payload) {
  return requestJson("/api/colorize", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function cleanOutputs() {
  return requestJson("/api/clean-outputs", { method: "POST" });
}

export async function deleteFile(target) {
  return requestJson("/api/delete-file", {
    method: "POST",
    body: JSON.stringify({ path: target })
  });
}

export async function openFolder(target) {
  if (window.mangaAPI?.openFolder) {
    return window.mangaAPI.openFolder(target);
  }
  return requestJson("/api/open-folder", {
    method: "POST",
    body: JSON.stringify({ path: target })
  });
}

export async function openFile(target) {
  if (!window.mangaAPI?.openFile) {
    throw new Error("openFile requires the Electron preload API");
  }
  return window.mangaAPI.openFile(target);
}

export async function selectFolder() {
  return window.mangaAPI?.selectFolder?.() || null;
}

export async function selectPdf() {
  return window.mangaAPI?.selectPdf?.() || null;
}

export async function selectImageFolder() {
  return window.mangaAPI?.selectImageFolder?.() || null;
}

export async function selectPdfFile() {
  return window.mangaAPI?.selectPdfFile?.() || null;
}

export async function selectCbzFile() {
  return window.mangaAPI?.selectCbzFile?.() || null;
}

export async function getAppVersion() {
  return window.mangaAPI?.getAppVersion?.() || "local";
}

export async function getLibraryBooks() {
  return requestJson("/api/library/books");
}

export async function importLibraryFolder(payload) {
  return requestJson("/api/library/import-folder", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function importLibraryPdf(payload) {
  return requestJson("/api/library/import-pdf", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function importLibraryCbz(payload) {
  return requestJson("/api/library/import-cbz", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getLibraryBook(bookId) {
  return requestJson(`/api/library/book/${bookId}`);
}

export async function getLibraryBookPage(bookId, pageNumber) {
  return requestJson(`/api/library/book/${bookId}/page/${pageNumber}`);
}

export async function colorizeLibraryPage(bookId, pageNumber) {
  return requestJson(`/api/library/book/${bookId}/colorize-page`, {
    method: "POST",
    body: JSON.stringify({ pageNumber })
  });
}

export async function colorizeLibraryRange(bookId, startPage, endPage) {
  return requestJson(`/api/library/book/${bookId}/colorize-range`, {
    method: "POST",
    body: JSON.stringify({ startPage, endPage })
  });
}

export async function setLibraryCurrentPage(bookId, pageNumber) {
  return requestJson(`/api/library/book/${bookId}/set-current-page`, {
    method: "POST",
    body: JSON.stringify({ pageNumber })
  });
}

export async function exportLibraryPdf(bookId) {
  return requestJson(`/api/library/book/${bookId}/export-pdf`, {
    method: "POST"
  });
}

export async function deleteLibraryBook(bookId) {
  return requestJson(`/api/library/book/${bookId}/delete`, {
    method: "POST"
  });
}

export async function clearLibraryCache() {
  return requestJson("/api/library/clear-cache", {
    method: "POST"
  });
}

export { API_BASE };
