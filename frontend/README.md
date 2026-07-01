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
- TypeScript (recommended)

## Setup (Sprint 1)

```bash
cd frontend
npm install
cp .env.example .env   # Windows: copy .env.example .env
npx expo start
```

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
- Backend must be running: `uvicorn main:app --host 0.0.0.0 --port 8000` (so it listens on the network, not only `127.0.0.1`).
- Add the same IP to backend CORS — see [../backend/.env.example](../backend/.env.example) (`CORS_ORIGINS=...,http://192.168.x.x:8081`).

After changing `.env`, restart Expo (`npx expo start`).

## Related docs

- [../docs/USER_STORIES.md](../docs/USER_STORIES.md)
- [../docs/SPRINT_PLAN.md](../docs/SPRINT_PLAN.md)
