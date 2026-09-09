import axios from 'axios';

export async function analyzeImage(file) {
  if (!process.env.AI_SERVICE_URL) return { available: false, detected: false, detections: [] };
  try {
    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    const { data } = await axios.post(`${process.env.AI_SERVICE_URL.replace(/\/$/, '')}/predict`, form, {
      timeout: 30000,
      maxBodyLength: 8 * 1024 * 1024,
      maxContentLength: 2 * 1024 * 1024
    });
    return {
      available: Boolean(data?.available),
      detected: Boolean(data?.detected),
      confidence: typeof data?.confidence === 'number' ? data.confidence : undefined,
      detections: Array.isArray(data?.detections) ? data.detections : []
    };
  } catch (error) {
    console.warn('AI service unavailable:', error.message);
    return { available: false, detected: false, detections: [] };
  }
}
