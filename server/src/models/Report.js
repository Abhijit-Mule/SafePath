import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: { type: String, required: true },
  location: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, trim: true, maxlength: 300 }
  },
  description: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['reported', 'verified', 'resolved'], default: 'reported' },
  ai: {
    available: { type: Boolean, default: false },
    detected: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1 },
    detections: { type: Array, default: [] }
  }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
