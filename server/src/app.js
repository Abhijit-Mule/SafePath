import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean)
  : true;

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'safepath-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Image must be 8 MB or smaller' });
  if (err.message?.includes('Only JPEG, PNG and WebP')) return res.status(400).json({ message: err.message });
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Internal server error' });
});

export default app;
