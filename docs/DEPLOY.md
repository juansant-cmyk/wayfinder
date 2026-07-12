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
| `USE_MOCK_PROVIDERS` | `true` |
| `CORS_ORIGINS` | Comma-separated origins (see below) |

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
```

**Restart Expo** or **rebuild TestFlight** after changing this.

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
| Move to Fly.io later | Same FastAPI code — redeploy with new host + update app URL |

---

## Related

- [../backend/README.md](../backend/README.md) — API reference
- [../database/README.md](../database/README.md) — local Docker Postgres
- [SPRINT_1_CLOSEOUT.md](SPRINT_1_CLOSEOUT.md) — sprint checklist
