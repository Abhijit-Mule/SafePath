import os
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image

load_dotenv()
app = FastAPI(title='SafePath AI Service', version='1.0.0')

MODEL_PATH = Path(os.getenv('MODEL_PATH', 'best.pt'))
THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.35'))
_model = None


def load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(f'Model weights not found at {MODEL_PATH}')
        from ultralytics import YOLO
        _model = YOLO(str(MODEL_PATH))
    return _model


@app.get('/health')
def health():
    return {'status': 'ok', 'model_loaded': _model is not None, 'model_configured': MODEL_PATH.exists()}


@app.post('/predict')
async def predict(file: Annotated[UploadFile, File(...)]):
    if file.content_type not in {'image/jpeg', 'image/png', 'image/webp'}:
        raise HTTPException(400, 'Only JPEG, PNG and WebP images are supported')
    try:
        image = Image.open(file.file).convert('RGB')
        model = load_model()
        results = model.predict(image, conf=THRESHOLD, verbose=False)
        detections = []
        for result in results:
            names = result.names
            if result.boxes is None:
                continue
            for box in result.boxes:
                confidence = float(box.conf[0])
                cls = int(box.cls[0])
                xyxy = [round(float(v), 2) for v in box.xyxy[0].tolist()]
                detections.append({'class': names.get(cls, str(cls)), 'confidence': confidence, 'box': xyxy})
        best = max((d['confidence'] for d in detections), default=None)
        return {'available': True, 'detected': bool(detections), 'confidence': best, 'detections': detections}
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, f'Inference failed: {exc}') from exc
