# Frontend

React Native (Expo) mobile app for Wayfinder.

## Team ownership

| Area | Sprint 1 focus |
|------|----------------|
| Navigation | Tab/dashboard shell (US-04) |
| Auth screens | Login / register (US-01) |
| Theming | Theme presets (Sprint 3, US-06) |

## Stack

- React Native
- Expo
- JavaScript (current app) — TypeScript recommended for new modules

## Setup (Sprint 1)

```bash
cd frontend
npm install
npx expo install expo-secure-store
cp .env.example .env   # Windows: copy .env.example .env
npx expo start
```

Ensure the backend is running — see [../backend/README.md](../backend/README.md).

---

## API URL (`EXPO_PUBLIC_API_URL`)

The app calls the FastAPI backend using `EXPO_PUBLIC_API_URL` in `.env`.

### Simulator / emulator (same machine as backend)

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Use this when running iOS Simulator, Android Emulator, or Expo web on the **same PC** that runs `uvicorn`.

### Physical device (phone on Wi‑Fi)

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

Replace `192.168.x.x` with your computer’s **local network IP**, not `localhost`.

- A phone cannot reach `localhost` on your laptop — that points to the phone itself.
- Find your IP on Windows: `ipconfig` → **IPv4 Address** under your Wi‑Fi adapter.
- Phone and PC must be on the **same Wi‑Fi network**.
- Backend must listen on the network: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Add your device’s Expo origin to backend CORS — see [../backend/.env.example](../backend/.env.example) (`CORS_ORIGINS=...,http://192.168.x.x:8081`).

After changing `.env`, restart Expo (`npx expo start`).

---

## Hybrid auth (Sprint 1)

Registration and login call the real backend. The app opens the login screen until a valid session exists (`SecureStore` token + `GET /auth/me`).

Sign up with email, full name, username, and password. Sign in with **email or username** plus password. Invalid credentials are rejected by the API.

---

Base URL: `{EXPO_PUBLIC_API_URL}` (no trailing slash).

Interactive docs: `{EXPO_PUBLIC_API_URL}/docs`

### Pydantic request bodies (what to send)

These mirror [../backend/app/schemas/auth.py](../backend/app/schemas/auth.py).

**RegisterRequest / LoginRequest** (same shape):

```json
{
  "email": "traveler@example.com",
  "password": "password123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | Valid email address; stored lowercase on the server |
| `password` | string | Minimum 8 characters |

### Response bodies (what you receive)

**TokenResponse** — returned by `POST /auth/register` and `POST /auth/login`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "traveler@example.com",
    "created_at": "2026-06-30T12:00:00+00:00"
  }
}
```

**UserResponse** — returned by `GET /auth/me`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "traveler@example.com",
  "created_at": "2026-06-30T12:00:00+00:00"
}
```

### TypeScript types (optional)

```typescript
export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginRequest = RegisterRequest;

export type UserResponse = {
  id: string;
  email: string;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: UserResponse;
};

export type ApiError = {
  detail: string | { loc: string[]; msg: string; type: string }[];
};
```

### Endpoints

| Method | Path | Auth header | Success | Purpose |
|--------|------|-------------|---------|---------|
| `POST` | `/auth/register` | — | `201` + `TokenResponse` | Create account |
| `POST` | `/auth/login` | — | `200` + `TokenResponse` | Sign in |
| `GET` | `/auth/me` | `Authorization: Bearer <token>` | `200` + `UserResponse` | Restore session / show profile |

### Error responses

FastAPI returns JSON: `{ "detail": "..." }` (or a validation array for `422`).

| Status | When | Example `detail` |
|--------|------|-------------------|
| `400` | Email already registered | `"Email already registered"` |
| `401` | Wrong login or missing/invalid token | `"Invalid email or password"`, `"Not authenticated"`, `"Invalid or expired token"` |
| `422` | Invalid email format or password too short | Pydantic validation array |

**UI mapping (US-01):**

- `422` → show field validation (password must be at least 8 characters).
- `400` on register → “This email is already in use.”
- `401` on login → “Invalid email or password.” (do not distinguish email vs password).
- `401` on `/auth/me` → clear stored token and return to login.

### Token lifetime

- Access token only (no refresh token in Sprint 1).
- Expires after **24 hours** — user must log in again.
- Logout is **client-only**: delete the token from SecureStore; no server endpoint.

---

## Connecting Expo to auth routes

### 1. Install SecureStore

```bash
npx expo install expo-secure-store
```

Store the JWT after register/login:

```javascript
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "wayfinder_access_token";

export async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
```

### 2. API client

Create `src/api/client.js` (or similar):

```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function parseError(response) {
  const body = await response.json().catch(() => ({}));
  const detail = body.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return "Something went wrong";
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
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
```

### 3. Auth flow in `App.js`

Today `App.js` opens the tab navigator immediately. For US-01, gate on auth state:

```
App launch
  → read token from SecureStore
  → if token: GET /auth/me
       → success: show Tab navigator (Home, Explore, …)
       → 401: clear token → show Auth stack
  → if no token: show Auth stack (Login + Register screens)
```

Suggested navigation structure:

```javascript
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AuthScreens() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Root: isAuthenticated ? <MainTabs /> : <AuthScreens />
```

Install stack navigator if needed:

```bash
npm install @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

### 4. Login / Register screens

Both screens POST the same `{ email, password }` body. On success:

```javascript
import { register, login } from "../api/client";
import { saveToken } from "../auth/tokenStorage";

async function handleRegister(email, password) {
  const data = await register(email, password);
  await saveToken(data.access_token);
  // setIsAuthenticated(true) or navigate to main tabs
}

async function handleLogin(email, password) {
  const data = await login(email, password);
  await saveToken(data.access_token);
  // setIsAuthenticated(true)
}
```

Show `error.message` from the API client in a banner or under the form.

**Client-side validation** (before calling API):

- Email non-empty and contains `@`
- Password length ≥ 8

### 5. Use auth on protected UI

After login, wire the Home header to the real user:

```javascript
const token = await getToken();
const user = await fetchMe(token);
// user.email → replace hardcoded "User" in HomeScreen
```

On any future protected API call, pass the token:

```javascript
await apiRequest("/some/protected/route", { token: await getToken() });
```

If the response is `401`, call `clearToken()` and return to the auth stack.

### 6. Logout (Profile tab)

```javascript
await clearToken();
// setIsAuthenticated(false)
```

---

## Checklist for frontend (Sprint 1 auth)

- [ ] `EXPO_PUBLIC_API_URL` set in `.env`
- [ ] `expo-secure-store` installed
- [ ] API client calls `/auth/register`, `/auth/login`, `/auth/me`
- [ ] Login + Register screens built
- [ ] `App.js` gates tabs behind auth state
- [ ] Session restored on app launch via `/auth/me`
- [ ] Logout clears SecureStore
- [ ] Error messages mapped from API `detail`

---

## Related docs

- [../backend/README.md](../backend/README.md) — backend setup and auth implementation
- [../docs/USER_STORIES.md](../docs/USER_STORIES.md) — US-01 acceptance criteria
- [../docs/SPRINT_PLAN.md](../docs/SPRINT_PLAN.md)
