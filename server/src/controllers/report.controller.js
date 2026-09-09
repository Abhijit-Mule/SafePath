import Report from '../models/Report.js';
import { analyzeImage } from '../services/ai.service.js';
import { storeImage } from '../services/storage.service.js';

function normalizeAiResult(ai) {
  if (!ai || typeof ai !== 'object') return { available: false, detected: false, detections: [] };
  const detections = Array.isArray(ai.detections) ? ai.detections.filter(item => item && typeof item === 'object').map(item => ({
    class: String(item.class ?? 'unknown').slice(0, 80),
    confidence: Number.isFinite(Number(item.confidence)) ? Math.min(1, Math.max(0, Number(item.confidence))) : undefined,
    box: Array.isArray(item.box) ? item.box.slice(0, 4).map(Number).filter(Number.isFinite) : undefined
  })) : [];
  const confidence = Number.isFinite(Number(ai.confidence)) ? Math.min(1, Math.max(0, Number(ai.confidence))) : undefined;
  return {
    available: Boolean(ai.available),
    detected: Boolean(ai.detected && detections.length),
    confidence,
    detections
  };
}

export async function listReports(req, res, next) {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).populate('reporter', 'name');
    res.json(reports);
  } catch (err) { next(err); }
}

export async function getReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id).populate('reporter', 'name');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) { next(err); }
}

export async function createReport(req, res, next) {
  try {
    const { lat, lng, address, description } = req.validatedReport;
    const [aiResult, imageUrl] = await Promise.all([analyzeImage(req.file), storeImage(req.file)]);
    const ai = normalizeAiResult(aiResult);
    const report = await Report.create({ reporter: req.user.id, imageUrl, location: { lat, lng, address }, description, ai });
    res.status(201).json(report);
  } catch (err) { next(err); }
}

export async function updateReportStatus(req, res, next) {
  try {
    const allowed = ['reported', 'verified', 'resolved'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid report status' });
    const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).populate('reporter', 'name');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) { next(err); }
}

export async function dashboardStats(req, res, next) {
  try {
    const [total, reported, verified, resolved] = await Promise.all([
      Report.countDocuments(), Report.countDocuments({ status: 'reported' }),
      Report.countDocuments({ status: 'verified' }), Report.countDocuments({ status: 'resolved' })
    ]);
    res.json({ total, reported, verified, resolved });
  } catch (err) { next(err); }
}
