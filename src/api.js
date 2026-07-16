const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    throw new Error("Could not connect to the API. Check that FastAPI is running.");
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.detail || `Request failed with status ${response.status}.`);
  }
  return data;
}

export function uploadResume(file) {
  const body = new FormData();
  body.append("file", file);
  return request("/resumes", { method: "POST", body });
}

export function createApplication(jdText) {
  return request("/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd_text: jdText }),
  });
}

export function scoreApplication(appId) {
  return request(`/applications/${appId}/score`, { method: "POST" });
}

export function tailorApplication(appId) {
  return request(`/applications/${appId}/tailor`, { method: "POST" });
}

export function getApplications() {
  return request("/applications");
}

export function updateApplicationStatus(appId, status) {
  return request(`/applications/${appId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
