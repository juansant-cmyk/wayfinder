# Deploy Wayfinder — Supabase + Render

Production stack:

| Layer | Service |
|-------|---------|
| Database | **Supabase** (PostgreSQL + PostGIS) |
| API | **Render** (FastAPI / uvicorn) |
| Mobile | Expo EAS → TestFlight (see [../frontend/README.md](../frontend/README.md)) |

Local dev still uses Docker Postgres in [`database/`](../database/README.md).

---

## Production URLs (Wayfinder)

| Resource | URL |
|----------|-----|
| API base | `https://wayfinder-e30f.onrender.com` |
| Health check | [https://wayfinder-e30f.onrender.com/health](https://wayfinder-e30f.onrender.com/health) |
| API docs | [https://wayfinder-e30f.onrender.com/docs](https://wayfinder-e30f.onrender.com/docs) |

Set in `frontend/.env` for production / TestFlight builds:

```env
EXPO_PUBLIC_API_URL=https://wayfinder-e30f.onrender.com
EXPO_PUBLIC_API_URL_WEB=https://wayfinder-e30f.onrender.com
```

---

## 1. Supabase (database)

### Create project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Pick a region close to your Render region (e.g. US West)
3. Save the database password

### Enable PostGIS

1. **Database → Extensions**
2. Search **postgis** → **Enable**

### Run schema

1. **SQL → New query**
2. Paste contents of [`database/supabase_init.sql`](../database/supabase_init.sql)
3. **Run**

`supabase_init.sql` includes favorites plus plan status/cover columns (`007` / `008`). On an **existing** project that was initialized earlier, also run the idempotent files in order if needed:

- [`database/schema/005_favorites.sql`](../database/schema/005_favorites.sql)
- [`database/schema/006_plan_itinerary.sql`](../database/schema/006_plan_itinerary.sql) (hotel link + plan days/activities)
- [`database/schema/007_plan_status.sql`](../database/schema/007_plan_status.sql)
- [`database/schema/008_plan_cover_image.sql`](../database/schema/008_plan_cover_image.sql)

Missing `favorites` causes `GET /favorites` → 500. Missing `status` / `cover_image_url` breaks plan list/hydrate after those fields ship in the API.

### Connection string (for Render)

1. **Project Settings → Database**
2. Under **Connection string**, choose **URI**
3. Use **Direct connection** or **Session pooler** (not Transaction pooler — async SQLAlchemy works best with these)
4. Copy the URI — looks like:

   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

5. Paste into Render as `DATABASE_URL` (the backend auto-converts to `postgresql+asyncpg://` and adds `ssl=require`)

---

## 2. Render (FastAPI API)

### Deploy from GitHub

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect the **wayfinder** repo — Render reads [`render.yaml`](../render.yaml) at the repo root
4. Or manually: **New Web Service** → repo → set **Root Directory** to `backend`

### Manual settings (if not using Blueprint)

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements-prod.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |
| Plan | **Starter** (recommended — free tier sleeps on idle) |

### Environment variables (Render dashboard)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase URI from step 1 |
| `JWT_SECRET` | Long random string (Render can auto-generate) |
| `JWT_EXPIRE_HOURS` | `24` |
| `USE_MOCK_PROVIDERS` | `true` (recommended — resilient hotel/weather fallback) |
| `WEATHER_PROVIDER` | `weatherapi` for live weather |
| `WEATHER_API_KEY` | WeatherAPI.com key (dashboard secret; not in git) |
| `HOTEL_PROVIDER` | `liteapi` when demoing live hotels |
| `LITEAPI_API_KEY` | LiteAPI key if `HOTEL_PROVIDER=liteapi` |
| `CORS_ORIGINS` | Comma-separated origins (see below) |
| `GOOGLE_MAPS_API_KEY` | Optional; Nominatim geo suggest works without it |

Blueprint template: [`render.yaml`](../render.yaml) declares `WEATHER_PROVIDER` / `WEATHER_API_KEY` (`sync: false`). After first Blueprint sync, set `WEATHER_API_KEY` in the Render dashboard or weather stays on the mock provider.

**CORS example** (set in Render **Environment** → `CORS_ORIGINS`):

```
https://wayfinder-e30f.onrender.com,http://localhost:8081,http://localhost:19006
```

Native iOS (Expo Go / TestFlight) does not use CORS — only web builds do.

### Verify deploy

Open:

```
https://wayfinder-e30f.onrender.com/health
```

Should return `{"status":"healthy"}`.

API docs:

```
https://wayfinder-e30f.onrender.com/docs
```

### Seed test user (optional)

From your PC with `DATABASE_URL` pointing at Supabase:

```powershell
cd backend
$env:DATABASE_URL="postgresql://postgres.[ref]:[password]@...supabase.com:5432/postgres"
python scripts/seed_test_user.py
```

---

## 3. Point the mobile app at Render

In `frontend/.env` (or EAS build secrets):

```env
EXPO_PUBLIC_API_URL=https://wayfinder-e30f.onrender.com
EXPO_PUBLIC_API_URL_WEB=https://wayfinder-e30f.onrender.com
```

**Restart Expo** or **rebuild TestFlight** after changing this. For local API work later, switch back to your LAN/`127.0.0.1` URL.

---

## 4. Architecture diagram

```
iPhone (Expo Go / TestFlight)
        │  HTTPS
        ▼
Render — FastAPI (JWT auth, dashboard routes)
        │  postgres + ssl
        ▼
Supabase — PostgreSQL + PostGIS (users, plans, places, hotels)
```

---

## 5. Local vs production

| | Local | Production |
|---|-------|------------|
| Database | Docker `:55432` | Supabase |
| API | `localhost:8000` | `https://wayfinder-e30f.onrender.com` |
| Frontend env | `http://10.0.0.34:8000` or `localhost` | `https://wayfinder-e30f.onrender.com` |

Keep local `.env` files **out of git**. Use Render/Supabase dashboards for production secrets.

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| Render build fails | Check **Root Directory** is `backend` |
| DB connection error | Verify Supabase URI, password, and **Direct/Session** pooler |
| `postgis` extension missing | Enable in Supabase → Extensions |
| Sign up shows "Something went wrong" or 500 | Open `/health/db` — if 503, fix `DATABASE_URL` on Render (Supabase **Session** or **Direct** pooler, port 5432) and run [`database/supabase_init.sql`](../database/supabase_init.sql) in Supabase SQL Editor |
| `/health/db` returns 503 | Wrong Supabase password, missing `ssl`, transaction pooler without code fix, or schema not applied |
| Deploy log: `tenant/user postgres.[ref] not found` | Pooler **region/host is wrong** — re-copy the Session pooler URI from Supabase (do not guess `aws-0-us-west-1`; use your project's exact host) |
| Render deploy exits on startup | Fixed in latest backend — DB check logs a warning but app still starts; fix `DATABASE_URL` then check `/health/db` |
| Login works locally, not on phone | `EXPO_PUBLIC_API_URL=https://wayfinder-e30f.onrender.com` (not `localhost`) |
| Expo shows "Cannot reach the API" to Render | Wake the service (open `/health` in a browser), wait up to ~60s, retry. Expo web also needs `CORS_ORIGINS` to include `http://localhost:8081` (and other Expo ports). Native Expo Go ignores CORS. Client timeout for `*.onrender.com` is 90s. |
| `/favorites` returns 500 | Run [`005_favorites.sql`](../database/schema/005_favorites.sql) on Supabase |
| Weather still shows mock / `"Your destination"` | Set `WEATHER_PROVIDER=weatherapi` and a valid `WEATHER_API_KEY` on Render, then redeploy |
| `/geo/suggest` 404 | Deploy includes geo suggest — confirm latest `main` is live on Render |
| Move to Fly.io later | Same FastAPI code — redeploy with new host + update app URL |

---

## Related

- [../backend/README.md](../backend/README.md) — API reference
- [../database/README.md](../database/README.md) — local Docker Postgres
- [SPRINT_1_CLOSEOUT.md](SPRINT_1_CLOSEOUT.md) — sprint checklist
