export const API_URL_ENV_NAME = "EXPO_PUBLIC_API_URL";

const rawApiUrl =
  typeof process !== "undefined" ? process.env?.[API_URL_ENV_NAME] ?? "" : "";

export const API_URL = rawApiUrl.trim().replace(/\/$/, "");

export const API_CONFIG_ERROR_MESSAGE = `Backend URL is missing. Set ${API_URL_ENV_NAME} in frontend/.env`;

export const API_UNAVAILABLE_MESSAGE =
  "The Wayfinder server is temporarily unavailable. Please try again in a moment.";

export function getApiUrl() {
  return API_URL;
}

export function isBackendConfigured() {
  return API_URL.length > 0;
}
