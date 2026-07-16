import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "wayfinder_access_token";
const USER_KEY = "wayfinder_session_user";

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
  const serializedUser = JSON.stringify(user);

  if (Platform.OS === "web") {
    window.localStorage.setItem(USER_KEY, serializedUser);
    return;
  }

  await SecureStore.setItemAsync(USER_KEY, serializedUser);
}

export async function getSessionUser() {
  let serializedUser = null;

  if (Platform.OS === "web") {
    serializedUser = window.localStorage.getItem(USER_KEY);
  } else {
    serializedUser = await SecureStore.getItemAsync(USER_KEY);
  }

  if (!serializedUser) {
    return null;
  }

  try {
    return JSON.parse(serializedUser);
  } catch {
    return null;
  }
}

export async function clearSessionUser() {
  if (Platform.OS === "web") {
    window.localStorage.removeItem(USER_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(USER_KEY);
}
