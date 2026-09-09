import Report from '../models/Report.js';
import { analyzeImage } from '../services/ai.service.js';

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
    if (!req.file) return res.status(400).json({ message: 'A road image is required' });
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    const ai = await analyzeImage(req.file);
    const report = await Report.create({
      reporter: req.user.id,
      imageUrl: `memory://${req.file.originalname}`,
      location: { lat, lng, address: req.body.address },
      description: req.body.description,
      ai
    });
    res.status(201).json(report);
  } catch (err) { next(err); }
}

export async function dashboardStats(req, res, next) {
  try {
    const [total, reported, verified, resolved] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'reported' }),
      Report.countDocuments({ status: 'verified' }),
      Report.countDocuments({ status: 'resolved' })
    ]);
    res.json({ total, reported, verified, resolved });
  } catch (err) { next(err); }
}
