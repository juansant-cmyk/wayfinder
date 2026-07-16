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

    // Expo web on this PC (localhost:8081) — API is on the same machine.
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

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createApiUnavailableError() {
  const error = new Error(API_UNAVAILABLE_MESSAGE);
  error.name = "ApiUnavailableError";
  error.code = "API_UNAVAILABLE";
  error.apiUrl = API_URL;
  return error;
}

function createApiTimeoutError() {
  const error = new Error(API_UNAVAILABLE_MESSAGE);
  error.name = "ApiUnavailableError";
  error.code = "API_TIMEOUT";
  error.apiUrl = API_URL;
  return error;
}

function createApiConfigError() {
  const error = new Error(API_CONFIG_ERROR_MESSAGE);
  error.name = "ApiConfigError";
  error.code = "API_NOT_CONFIGURED";
  return error;
}

function createApiRequestFailedError(requestError) {
  const error = new Error("The login request could not be completed.");
  error.name = "ApiRequestFailedError";
  error.code = "API_REQUEST_FAILED";
  error.causeName = requestError?.name ?? null;
  error.causeMessage = requestError?.message ?? null;
  error.apiUrl = API_URL;
  return error;
}

function createApiResponseError(response, raw, parsedBody) {
  const body = parsedBody || {};
  const error = new Error(buildErrorMessage(response, raw, body));
  error.name = "ApiResponseError";
  error.code = `API_HTTP_${response.status}`;
  error.status = response.status;
  error.detail = body.detail;
  error.fieldErrors = extractValidationErrors(body.detail);
  error.apiUrl = API_URL;
  return error;
}

export function getApiUrl() {
  return resolveApiUrl();
}

export function isBackendConfigured() {
  return Boolean(getApiUrl());
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

export function isApiConfigError(error) {
  return error?.code === "API_NOT_CONFIGURED" || error?.name === "ApiConfigError";
}

export function isApiRequestFailedError(error) {
  return error?.code === "API_REQUEST_FAILED" || error?.name === "ApiRequestFailedError";
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

async function readResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function parseJsonSafely(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractValidationErrors(detail) {
  if (!Array.isArray(detail)) {
    return {};
  }

  return detail.reduce((fieldErrors, item) => {
    const path = Array.isArray(item?.loc) ? item.loc : [];
    const fieldName = path[path.length - 1];
    if (typeof fieldName !== "string" || typeof item?.msg !== "string") {
      return fieldErrors;
    }

    return {
      ...fieldErrors,
      [fieldName]: item.msg,
    };
  }, {});
}

function buildErrorMessage(response, raw, body) {
  if (raw && Object.keys(body).length === 0) {
    return raw.trim() || `Request failed (${response.status}).`;
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

function logDevLoginFailure(data) {
  if (!__DEV__) {
    return;
  }

  console.info("[auth/login]", data);
}

async function parseSuccess(response) {
  const raw = await readResponseText(response);

  if (!raw) {
    return null;
  }

  const body = parseJsonSafely(raw);
  if (body !== null) {
    return body;
  }

  throw new Error("The Wayfinder server returned an unreadable response.");
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
  let requestError = null;

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
    const raw = await readResponseText(response);
    const parsedBody = parseJsonSafely(raw);

    if (path === "/auth/login") {
      logDevLoginFailure({
        detail: parsedBody?.detail ?? null,
        event: "response",
        status: response.status,
      });
    }

    throw createApiResponseError(response, raw, parsedBody);
  }

  if (response.status === 204) {
    return null;
  }

  return parseSuccess(response);
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
}
