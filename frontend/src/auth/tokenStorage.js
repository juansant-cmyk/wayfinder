import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "wayfinder_access_token";
const SESSION_USER_KEY = "wayfinder_session_user";

export async function saveToken(token) {
  if (Platform.OS === "web") {
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  if (Platform.OS === "web") {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  if (Platform.OS === "web") {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveSessionUser(user) {
  const payload = JSON.stringify(user ?? null);
  if (Platform.OS === "web") {
    window.localStorage.setItem(SESSION_USER_KEY, payload);
    return;
  }

  await SecureStore.setItemAsync(SESSION_USER_KEY, payload);
}

export async function getSessionUser() {
  const raw =
    Platform.OS === "web"
      ? window.localStorage.getItem(SESSION_USER_KEY)
      : await SecureStore.getItemAsync(SESSION_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearSessionUser() {
  if (Platform.OS === "web") {
    window.localStorage.removeItem(SESSION_USER_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_USER_KEY);
}
