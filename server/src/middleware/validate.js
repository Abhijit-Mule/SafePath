import mongoose from 'mongoose';

export function validateReportInput(req, res, next) {
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return res.status(400).json({ message: 'Latitude must be between -90 and 90' });
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return res.status(400).json({ message: 'Longitude must be between -180 and 180' });
  if (address.length > 300) return res.status(400).json({ message: 'Address must be 300 characters or fewer' });
  if (description.length > 1000) return res.status(400).json({ message: 'Description must be 1000 characters or fewer' });
  if (!req.file) return res.status(400).json({ message: 'A road image is required' });

  req.validatedReport = { lat, lng, address, description };
  next();
}

export function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid report id' });
  next();
}
