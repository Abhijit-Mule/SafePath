# SafePath

**AI-Based Road Condition Analysis and Alert System**

SafePath is an academic project for reporting and analyzing road potholes using image-based AI detection, geolocation, and a public reporting dashboard.

## Architecture

- **Client:** React + Vite
- **API:** Node.js + Express
- **Database:** MongoDB / MongoDB Atlas
- **AI service:** Python + FastAPI + YOLOv8-compatible inference
- **Maps:** Leaflet + OpenStreetMap
- **Authentication:** JWT

```text
React Client
     |
     v
Node/Express API ------> MongoDB Atlas
     |
     v
Python AI Service -----> YOLO model
```

## Features

- User registration and login
- JWT-protected report creation
- Pothole image upload
- GPS coordinates and interactive Leaflet map
- Status filtering: reported / verified / resolved
- Public report history and image viewing
- Authority dashboard with live statistics
- Authority-only report status management
- AI detection through a separate inference service
- CORS and request validation

## Authority workflow

New accounts are created with the `user` role. Public registration cannot create an authority account. To create an authority for the academic/demo environment, promote the account directly in MongoDB:

```js
db.users.updateOne(
  { email: "authority@example.com" },
  { $set: { role: "authority" } }
)
```

After promotion, sign out and sign in again so the new JWT contains the authority role. Authority users can move reports between `reported`, `verified`, and `resolved`.

## Project structure

```text
SafePath/
├── client/       # React frontend + Leaflet map
├── server/       # Node/Express REST API
└── ai-service/   # Python/FastAPI inference service
```

## Local setup

### 1. API

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2. Client

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### 3. AI service

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --reload --port 8000
```

The AI service deliberately does not ship model weights. Put a trained YOLO weights file at the configured model path, or enable the explicitly labeled demo mode for UI development. No fabricated detection accuracy is claimed by this repository.

## Environment variables

See each `.env.example` file. Never commit real credentials, JWT secrets, MongoDB credentials, or model weights.

## API endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/reports`
- `POST /api/reports` (JWT + image)
- `GET /api/reports/:id`
- `GET /api/reports/dashboard/stats` (authority JWT)
- `PATCH /api/reports/:id/status` (authority JWT)

## Production note

The current upload implementation stores images on the API filesystem. Before production deployment on ephemeral/serverless infrastructure, move image storage to durable object storage such as S3-compatible storage or Cloudinary and keep only the public asset URL in MongoDB.

## Academic note

This repository is structured as a working foundation for the SafePath academic project. Model performance must be reported only after running evaluation on the project's actual dataset.
