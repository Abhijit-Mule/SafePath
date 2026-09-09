import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: { type: String, required: true, trim: true },
  location: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, trim: true, maxlength: 300 }
  },
  description: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['reported', 'verified', 'resolved'], default: 'reported', index: true },
  ai: {
    available: { type: Boolean, default: false },
    detected: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1 },
    detections: { type: Array, default: [] }
  }
}, { timestamps: true });

reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'location.lat': 1, 'location.lng': 1 });

export default mongoose.model('Report', reportSchema);
