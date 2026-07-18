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
  return (
    message.startsWith("Cannot reach the API") || message.includes("timed out")
  );
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

function isRenderApi(apiUrl) {
  try {
    return new URL(apiUrl).hostname.endsWith(".onrender.com");
  } catch {
    return false;
  }
}

function requestTimeoutMs(apiUrl) {
  // Render free/starter cold starts often exceed 20s; keep local APIs snappy.
  return isRenderApi(apiUrl) ? 90000 : 20000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function fetchOnce(apiUrl, path, { method, headers, body, timeoutMs }) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    return await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller?.signal,
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function unreachableMessage(apiUrl, error) {
  const aborted = error?.name === "AbortError";
  if (aborted) {
    return (
      `Request to ${apiUrl} timed out. Open ${apiUrl}/health in a browser to wake Render, ` +
      "then try again."
    );
  }

  const detail = error instanceof Error && error.message ? ` (${error.message})` : "";
  const webHint =
    typeof window !== "undefined"
      ? " If you are on Expo web, open the app at http://localhost:8081 (not a LAN IP) " +
        "or set Render CORS_ORIGINS to match the address bar origin."
      : "";

  return (
    `Cannot reach the API at ${apiUrl}${detail}. Check your internet connection, ` +
    "confirm EXPO_PUBLIC_API_URL in frontend/.env, and restart Expo (npx expo start --clear). " +
    "If the API is on Render, the first request after idle can take up to a minute." +
    webHint
  );
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

  const timeoutMs = requestTimeoutMs(apiUrl);
  const attempts = isRenderApi(apiUrl) ? 3 : 1;
  let response;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      // Wake sleeping Render instances before the real call.
      if (isRenderApi(apiUrl) && attempt === 1 && path !== "/health") {
        try {
          await fetchOnce(apiUrl, "/health", {
            method: "GET",
            headers: {},
            timeoutMs,
          });
        } catch {
          // Ignore wake failures; the real request may still succeed.
        }
      }

      response = await fetchOnce(apiUrl, path, {
        method,
        headers,
        body,
        timeoutMs,
      });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(2000 * attempt);
      }
    }
  }

  if (!response) {
    throw new Error(unreachableMessage(apiUrl, lastError));
  }

  if (response.status === 401 && token && unauthorizedHandler) {
    await unauthorizedHandler();
    throw new Error("Your session expired. Sign in again.");
  }

  if (!response.ok) {
    const message = await parseError(response);
    const err = new Error(message);
    err.status = response.status;
    throw err;
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
