import axios from 'axios';

export async function analyzeImage(file) {
  if (!process.env.AI_SERVICE_URL) return { available: false, detected: false, detections: [] };
  try {
    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, form, { timeout: 30000 });
    return data;
  } catch (error) {
    console.warn('AI service unavailable:', error.message);
    return { available: false, detected: false, detections: [] };
  }
}
