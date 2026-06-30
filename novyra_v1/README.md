# Smart Farm / Novyra — deployable on Fly.io or Railway

This repo is split into two independently deployable services, plus the
original hardware files kept for reference.

```
backend/    FastAPI service — wraps the original predict.py/train.py/
            sensors.py/preprocess.py/config.py logic behind HTTP endpoints
frontend/   Vite + React app — the NovyraApp.jsx UI, now calling the
            backend instead of a broken client-side Anthropic call
hardware/   Arduino sketch + Proteus circuit files (unchanged, reference only)
```

## What changed from the original files

- **`AIScreen` in NovyraApp.jsx** called `https://api.anthropic.com/v1/messages`
  directly from the browser with no API key. That only ever worked inside
  the Claude artifact sandbox, which injects credentials automatically —
  anywhere else it would fail with 401. It's been replaced with a call to
  `POST /api/predict` on the backend, which runs the actual trained
  scikit-learn models (the ones `train.py`/`predict.py` already implement)
  and an optional server-side LLM step for nicer phrasing, key never
  exposed to the client (see `backend/app/advice.py`).
- **`FarmManagementScreen`**'s "add field" input was calling `newName(...)`
  instead of `setNewName(...)` — fixed, the field now actually updates.
- **`main.py`, `sensors.manual()`'s `input()` prompts, and `print_report`**
  were CLI-only and don't apply to a deployed server — that logic is now
  inside `backend/app/main.py` (FastAPI) and `backend/app/advice.py`,
  returning JSON instead of printing.
- **No datasets were uploaded**, so `train.py` had nothing to train on.
  `backend/Datasets/generate_sample_datasets.py` generates plausible
  placeholder CSVs so the whole pipeline trains and runs out of the box.
  **Swap these for your real `Crop_Pred.csv` / `FertPredictDataset.csv`
  before relying on the predictions for anything real** — same column
  names, just replace the files and rebuild.

## Local development

```bash
docker compose up --build
# backend  -> http://localhost:8000  (try /health and /api/simulate)
# frontend -> http://localhost:4173
```

Or run each without Docker:

```bash
# backend
cd backend
pip install -r requirements.txt
python -m app.train          # trains + saves models to backend/models/
uvicorn app.main:app --reload --port 8000

# frontend (separate terminal)
cd frontend
cp .env.example .env.local   # VITE_API_BASE=http://localhost:8000
npm install
npm run dev                  # http://localhost:5173
```

## Deploying to Fly.io

Each service deploys as its own Fly app.

```bash
# 1. Backend
cd backend
fly launch --no-deploy            # pick a unique app name, accept fly.toml
fly secrets set SMARTFARM_CORS_ORIGINS=https://<your-frontend-app>.fly.dev
fly secrets set ANTHROPIC_API_KEY=sk-ant-...   # optional
fly deploy

# 2. Frontend — point it at the backend URL from step 1
cd ../frontend
fly launch --no-deploy
fly deploy --build-arg VITE_API_BASE=https://<your-backend-app>.fly.dev
```

`VITE_API_BASE` is baked into the static bundle at build time (Vite
inlines env vars), so it must be passed as a build arg, not a runtime
secret.

## Deploying to Railway — exact steps

Order matters here because the frontend needs the backend's URL, which
doesn't exist until the backend is deployed once. Two services, one repo.

**1. Push this repo to GitHub** (Railway deploys from a connected repo).

**2. Create the backend service**
   - Railway dashboard → **New Project → Deploy from GitHub repo** → select this repo.
   - On the new service: **Settings → Source → Root Directory** → set to `backend`.
   - Railway should detect `backend/railway.json` and use the Dockerfile builder automatically. If it asks you to pick a builder, choose **Dockerfile**.
   - **Settings → Variables** → add (optional but recommended):
     - `SMARTFARM_CORS_ORIGINS` — leave blank for now, you'll come back to this in step 5.
     - `ANTHROPIC_API_KEY` — optional, only if you want LLM-polished advice text.
   - Click **Deploy**. Wait for the build to finish (it trains the models during the build, so this takes a couple minutes).
   - **Settings → Networking → Generate Domain** if one wasn't auto-assigned. Copy this URL — e.g. `https://smart-farm-backend-production.up.railway.app`.
   - Sanity check: open `https://<that-url>/health` in a browser — you should see `{"status":"ok","models_trained":true}`.

**3. Create the frontend service**
   - Same project → **New → GitHub Repo** → same repo again.
   - **Settings → Source → Root Directory** → set to `frontend`.
   - **Settings → Build → Build Args** (Railway sometimes calls this "Build Arguments" under the Dockerfile build settings) → add:
     - `VITE_API_BASE` = the backend URL you copied in step 2, e.g. `https://smart-farm-backend-production.up.railway.app`
   - Click **Deploy**.
   - **Settings → Networking → Generate Domain**. Copy this URL too — e.g. `https://novyra-frontend-production.up.railway.app`.

**4. Open the frontend URL.** You should see the Novyra splash screen. Click through onboarding/auth and try "Run AI recommendation" on a field — if it spins forever or errors, it's almost always step 5 below (CORS).

**5. Go back to the backend service** → **Settings → Variables** → set:
   - `SMARTFARM_CORS_ORIGINS` = the frontend URL from step 3, e.g. `https://novyra-frontend-production.up.railway.app`
   - Redeploy the backend (Railway usually redeploys automatically on variable changes; if not, click **Redeploy**).

**6. Re-test the frontend.** The AI recommendation screen should now return real predictions instead of a network/CORS error.

If you ever change either service's URL (custom domain, regenerated domain, redeploy from scratch), you need to repeat step 3's build arg and step 5's CORS variable — they're both just strings pointing at each other, not auto-discovered.

## Retraining with real data

Replace `backend/Datasets/Crop_Pred.csv` and
`backend/Datasets/FertPredictDataset.csv` with your real datasets (same
column names: `N,P,K,pH,Crop` and `N,P,K,Ca,Mg,S,Lime,C,Moisture,class`),
then rebuild — `RUN python -m app.train` in the Dockerfile retrains and
bakes fresh models into the image automatically. There's no separate
"upload a model" step.

## Connecting real hardware

`hardware/Main_ckt_code_FIXED.ino` only sends readings over serial — it
has no networking. To feed real sensor data into the deployed backend,
the simplest path is swapping the Arduino for an ESP32 (or pairing the
Arduino with an ESP8266/HC-05) and POSTing readings as JSON to
`https://<your-backend>/api/predict`, matching the body shape in
`backend/app/main.py`'s `SensorPayload`. The Proteus files in `hardware/`
are circuit-simulation projects only and aren't part of the deploy.
