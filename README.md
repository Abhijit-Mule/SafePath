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
Python AI Service -----> pothole YOLO model
```

## Features

- User registration and login
- JWT-protected report creation
- JPEG/PNG/WebP image validation with an 8 MB limit
- GPS coordinate and address validation
- Production object storage for uploaded images
- Real YOLO pothole inference through a separate service
- Configurable confidence threshold and pothole class filtering
- Public report feed and interactive map
- Authority-only dashboard statistics and status updates
- Report lifecycle: `reported` → `verified` → `resolved`
- Automated client, API, MongoDB, and AI CI checks

## AI model

The default model is **`peterhdd/pothole-detection-yolov8`**, a YOLOv8s pothole detector published under the Apache-2.0 license. SafePath does not claim that this third-party model was trained by the project.

If `MODEL_PATH` does not exist, the AI service downloads the model from `MODEL_URL` on first inference. For production reproducibility, it is recommended to pre-download the model during the container/image build and set `MODEL_PATH` to that local file. You can also set `MODEL_SHA256` to verify the exact model file before loading it.

The service accepts `POTHOLE_CLASSES` as a comma-separated case-insensitive class allow-list. The default is `pothole,potholes`.

Model performance must be measured on the project's actual labeled dataset before publishing accuracy, precision, recall, mAP, or similar claims.

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

The default configuration downloads the selected pothole model automatically. For an offline/preloaded deployment, put the model at `MODEL_PATH` and optionally configure `MODEL_SHA256`.

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

Before deployment, configure a durable S3-compatible bucket/CDN, MongoDB Atlas, a strong JWT secret, CORS origin, and a pinned/preloaded YOLO model. Do not commit secrets or model weights.

Also configure `AI_SERVICE_URL`, `MODEL_PATH`, `MODEL_URL`, `MODEL_SHA256` (recommended for a fixed model), `CONFIDENCE_THRESHOLD`, `POTHOLE_CLASSES`, and `MAX_IMAGE_BYTES` as appropriate for the deployment.
