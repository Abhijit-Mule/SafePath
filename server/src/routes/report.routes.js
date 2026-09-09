import { Router } from 'express';
import multer from 'multer';
import { auth, authorityOnly } from '../middleware/auth.js';
import { validateObjectId, validateReportInput } from '../middleware/validate.js';
import { createReport, dashboardStats, getReport, listReports, updateReportStatus } from '../controllers/report.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPEG, PNG and WebP images are supported'));
} });

router.get('/', listReports);
router.get('/dashboard/stats', auth, authorityOnly, dashboardStats);
router.get('/:id', validateObjectId, getReport);
router.post('/', auth, upload.single('image'), validateReportInput, createReport);
router.patch('/:id/status', auth, authorityOnly, validateObjectId, updateReportStatus);
export default router;
