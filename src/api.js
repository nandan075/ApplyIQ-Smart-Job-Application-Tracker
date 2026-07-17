const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", ...options });
  } catch {
    throw new Error("Could not connect to the API. Check that FastAPI is running.");
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.detail || `Request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const signIn = (email, password) => request("/auth/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
export const signUp = (name, email, password) => request("/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
export const signInWithGoogle = (credential) => request("/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
export const signOut = () => request("/auth/logout", { method: "POST" });
export const getCurrentUser = () => request("/auth/me");
export const updateCurrentUser = (profile) => request("/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
export function uploadResume(file) { const body = new FormData(); body.append("file", file); return request("/resumes", { method: "POST", body }); }
export const getLatestResume = () => request("/resumes/latest");

export const createApplication = (jdText) => request("/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jd_text: jdText }) });
export const scoreApplication = (appId) => request(`/applications/${appId}/score`, { method: "POST" });
export const tailorApplication = (appId) => request(`/applications/${appId}/tailor`, { method: "POST" });
export const getApplications = () => request("/applications");
export function updateApplicationStatus(appId, status) {
  return request(`/applications/${appId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function downloadExport(appId, filename) {
  const url = `${API_BASE_URL}/applications/${appId}/export`;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const text = await response.text();
    let detail = "Failed to export tailored documents.";
    try {
      const data = JSON.parse(text);
      if (data?.detail) detail = data.detail;
    } catch (_) {}
    throw new Error(detail);
  }
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", filename || "tailored_application.md");
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
}