const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "";

let unauthorizedHandler = null;

export function getApiUrl() {
  return API_URL;
}

export function isBackendConfigured() {
  return Boolean(API_URL);
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function parseError(response) {
  const raw = await response.text();
  let body = {};

  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      return raw.trim() || `Request failed (${response.status}).`;
    }
  }

  const { detail } = body;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item === "string" ? item : item?.msg))
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  return `Request failed (${response.status}). Please try again.`;
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
      `Cannot reach the API at ${API_URL}. Check your internet connection, ` +
        "confirm EXPO_PUBLIC_API_URL in frontend/.env, and restart Expo (npx expo start --clear). " +
        "If the API is on Render, the first request after idle can take up to a minute."
    );
  }

  if (response.status === 401 && token && unauthorizedHandler) {
    await unauthorizedHandler();
    throw new Error("Your session expired. Sign in again.");
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function register({ email, password, fullName, username }) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: {
      email,
      password,
      full_name: fullName,
      username,
    },
  });
}

export function login(identity, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { identity, password },
  });
}

export function fetchMe(token) {
  return apiRequest("/auth/me", { token });
}
