const CONFIGURED_API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "";
const WEB_API_URL = process.env.EXPO_PUBLIC_API_URL_WEB?.replace(/\/$/, "") || "";

function isPrivateLanHost(url) {
  if (!url) {
    return false;
  }

  try {
    const { hostname } = new URL(url);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return false;
    }
    if (hostname.startsWith("10.")) {
      return true;
    }
    if (hostname.startsWith("192.168.")) {
      return true;
    }
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function isLocalWebDevHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function resolveApiUrl() {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const pageHost = window.location.hostname;

    // Expo web on this PC (localhost:8081) â€” API is on the same machine.
    if (isLocalWebDevHost(pageHost)) {
      if (WEB_API_URL) {
        return WEB_API_URL;
      }
      if (isPrivateLanHost(CONFIGURED_API_URL)) {
        return "http://127.0.0.1:8000";
      }
    }
  }

  return CONFIGURED_API_URL;
}

let unauthorizedHandler = null;

export function getApiUrl() {
  return resolveApiUrl();
}

export function isBackendConfigured() {
  return Boolean(getApiUrl());
}

export function isApiConfigError(error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("EXPO_PUBLIC_API_URL is not configured");
}

export function isApiUnavailableError(error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.startsWith("Cannot reach the API");
}

export function isApiRequestFailedError(error) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.startsWith("Request failed");
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

/** Notify app shell that the session is invalid (used by geo + apiRequest). */
export async function notifySessionExpired() {
  if (unauthorizedHandler) {
    await unauthorizedHandler();
  }
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
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }

  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(
      `Cannot reach the API at ${apiUrl}. Check your internet connection, ` +
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
