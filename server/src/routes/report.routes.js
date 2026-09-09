import { Router } from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import { createReport, dashboardStats, getReport, listReports } from '../controllers/report.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype));
} });

router.get('/', listReports);
router.get('/dashboard/stats', dashboardStats);
router.get('/:id', getReport);
router.post('/', auth, upload.single('image'), createReport);
export default router;
