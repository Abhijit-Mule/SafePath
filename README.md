# SafePath

**AI-Based Road Condition Analysis and Alert System**

SafePath is an academic project for reporting and analyzing road potholes using image-based AI detection, geolocation, and an authority workflow.

## Architecture

- **Client:** React + Vite + Leaflet
- **API:** Node.js + Express
- **Database:** MongoDB / MongoDB Atlas
- **Image storage:** S3-compatible object storage (AWS S3, Cloudflare R2, MinIO, etc.)
- **AI service:** Python + FastAPI + Ultralytics YOLO
- **Maps:** OpenStreetMap
- **Authentication:** JWT

```text
React Client
     |
     v
Node/Express API ------> MongoDB Atlas
     |
     +-----------------> S3-compatible object storage
     |
     v
Python AI Service -----> trained YOLO pothole model
```

## Features

- User registration and login
- JWT-protected report creation
- JPEG/PNG/WebP image validation with an 8 MB limit
- GPS coordinate and address validation
- Production object storage for uploaded images
- Real YOLO pothole inference through a separate service
- Configurable confidence threshold and pothole class names
- Public report feed and interactive map
- Authority-only dashboard statistics and status updates
- Report lifecycle: `reported` → `verified` → `resolved`
- Automated client, API, and AI CI checks

## Local setup

### API

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Configure MongoDB, JWT, the AI service URL, and an S3-compatible bucket in `.env`.

### Client

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### AI service

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload --port 8000
```

Place the **actual trained YOLO weights** at the configured `MODEL_PATH`. The repository does not include model weights and does not claim fabricated accuracy. The model's class names should include `pothole` (or configure `POTHOLE_CLASSES`).

## Authority access

Public registration always creates a normal `user`. To grant authority access for the academic deployment, promote a trusted account's `role` to `authority` directly in MongoDB. Never expose an authority role selector in public registration.

## API endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/reports`
- `POST /api/reports` — JWT + image
- `GET /api/reports/:id`
- `GET /api/reports/dashboard/stats` — authority only
- `PATCH /api/reports/:id/status` — authority only

## Production checklist

Before deployment, configure a durable S3-compatible bucket/CDN, MongoDB Atlas, a strong JWT secret, CORS origin, and a trained YOLO model. Do not commit secrets or model weights.

Model performance must be measured on the project's actual labeled dataset before publishing accuracy, precision, recall, mAP, or similar claims.
