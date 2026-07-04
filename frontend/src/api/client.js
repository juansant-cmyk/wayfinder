const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export function getApiUrl() {
  return API_URL;
}

export function isBackendConfigured() {
  return Boolean(API_URL);
}

async function parseError(response) {
  const body = await response.json().catch(() => ({}));
  const { detail } = body;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return "Something went wrong. Please try again.";
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }

  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(
      "Cannot reach the backend. Start Docker, then run the API on port 8000."
    );
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function register(email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export function login(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function fetchMe(token) {
  return apiRequest("/auth/me", { token });
}
