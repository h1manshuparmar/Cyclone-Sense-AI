# CycloneSense

AI/ML system for **identification, classification, and prediction** of tropical cyclone patterns over the North Indian Ocean (Arabian Sea and Bay of Bengal).

The dashboard combines three operational tasks that RSMC New Delhi performs by hand today:

| Task | Model | Output |
| --- | --- | --- |
| **Identify** | Multi-task CNN on IR imagery | Cyclone vs non-cyclone + Grad-CAM |
| **Classify** | Same CNN heads | Dvorak-style cloud pattern + IMD category + wind (kt) |
| **Predict** | Track LSTM + historical analogs | 72-hour track, intensity, land-threat flag |

## Architecture

```
INSAT-3D TIR crop          IBTrACS 6-hourly best-track
        │                            │
        ▼                            ▼
  CycloneImageNet              TrackLSTM (seq2seq)
  presence / pattern /         Δlat, Δlon, Δwind × 12
  IMD class / wind kt          (72 h at 6 h steps)
        │                            │
        └──────── FastAPI ───────────┘
                         │
                    React ops UI
```

**Classification taxonomy (IMD, 2015–present)**

- Depression 17–27 kt · Deep Depression 28–33 · Cyclonic Storm 34–47
- Severe CS 48–63 · Very Severe CS 64–89 · Extremely Severe CS 90–119
- Super Cyclonic Storm ≥ 120 kt

**Cloud patterns** follow Dvorak analysis used on INSAT IR: curved band, shear, central dense overcast (CDO), embedded centre, eye.

**Track families** are derived from the observed path: westward, northwestward, recurving, northward, looping.

## Data

- **IBTrACS v04r01** North Indian basin (`data/raw/ibtracs.NI.list.v04r01.csv`). Wind prefers IMD New Delhi, then WMO, then JTWC. Storms are interpolated to a regular 6-hour grid.
- **INSAT-3D/3DR TIR** from MOSDAC is the intended operational image source. The CNN ships pretrained on physically motivated IR pattern synthesis so the demo runs without a MOSDAC account. Retrain on labelled TIR crops for production.

Train / val / test for the LSTM is split by season: ≤2017 / 2018–2021 / ≥2022.

Held-out test skill (CPU-trained prototype): **~140 km / ~8 kt MAE at 24 h**, ~320 km / 13 kt at 48 h. Use as decision support alongside NWP, not as a replacement for RSMC official forecasts.

## Setup

Python 3.10+ and Node 18+ are required.

```powershell
cd "tropical cyclone patterns"
python -m pip install -r requirements.txt
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
python scripts/train_all.py
cd frontend
npm install
```

## Run

Terminal 1 — API:

```powershell
cd "tropical cyclone patterns"
$env:PYTHONPATH = "$pwd;$pwd\backend"
python -m uvicorn backend.app.main:app --reload --port 8000
```

Terminal 2 — UI:

```powershell
cd "tropical cyclone patterns\frontend"
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## API

- `GET /api/health` — models and catalog status
- `GET /api/stats` — basin / category climatology
- `GET /api/accuracy` — overall system accuracy, lead-time errors, and IMD benchmarks
- `GET /api/storms` — archive search
- `POST /api/identify` — multipart IR image
- `POST /api/predict` — JSON observations → LSTM + analog forecast
- `GET /api/predict/{sid}` — hindcast a historical storm (early track in, remainder held out)

## Retrain on real INSAT-3D imagery

Place grayscale TIR crops in a folder and adapt `backend/ml/train_images.py` to read them with IMD best-track wind labels. Keep the same multi-task heads so the API does not change.

## Notes for evaluators

- The LSTM and analog ensemble are trained/evaluated on **real** IBTrACS North Indian Ocean storms.
- Image identification is a working CNN with explainability (Grad-CAM). Swap in MOSDAC TIR to move from prototype to operations.
- This is a decision-support prototype, not an official IMD forecast.
# tropical-cyclone-patterns
