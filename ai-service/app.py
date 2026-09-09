import os
from pathlib import Path
from typing import Annotated
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

load_dotenv()
app = FastAPI(title='SafePath AI Service', version='1.2.0')

MODEL_PATH = Path(os.getenv('MODEL_PATH', 'models/pothole-yolov8s.pt'))
MODEL_URL = os.getenv(
    'MODEL_URL',
    'https://huggingface.co/peterhdd/pothole-detection-yolov8/resolve/main/best.pt',
)
THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.35'))
_model = None
_model_error = None


def ensure_model_file():
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    if MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 1024:
        return
    request = Request(MODEL_URL, headers={'User-Agent': 'SafePath-AI/1.0'})
    with urlopen(request, timeout=120) as response, MODEL_PATH.open('wb') as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)


def load_model():
    global _model, _model_error
    if _model is None:
        try:
            ensure_model_file()
            from ultralytics import YOLO
            _model = YOLO(str(MODEL_PATH))
            _model_error = None
        except Exception as exc:
            _model_error = str(exc)
            raise RuntimeError(f'Unable to load pothole model: {exc}') from exc
    return _model


@app.get('/health')
def health():
    return {
        'status': 'ok' if _model_error is None else 'degraded',
        'model_loaded': _model is not None,
        'model_configured': MODEL_PATH.exists(),
        'model': 'peterhdd/pothole-detection-yolov8',
        'error': _model_error,
    }


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
                class_name = str(names.get(cls, cls))
                detections.append({
                    'class': class_name,
                    'confidence': round(confidence, 6),
                    'box': [round(float(v), 2) for v in box.xyxy[0].tolist()],
                })
        best = max((d['confidence'] for d in detections), default=None)
        return {
            'available': True,
            'model': 'peterhdd/pothole-detection-yolov8',
            'detected': bool(detections),
            'confidence': best,
            'detections': detections,
        }
    except UnidentifiedImageError as exc:
        raise HTTPException(400, 'The uploaded file is not a valid image') from exc
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, f'Inference failed: {exc}') from exc
