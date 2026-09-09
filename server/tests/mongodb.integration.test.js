import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Report from '../src/models/Report.js';
import User from '../src/models/User.js';

const mongoUri = process.env.MONGO_URI;
const shouldRun = Boolean(mongoUri);
const describe = shouldRun ? test : test.skip;
const testId = `ci-${Date.now()}-${Math.random().toString(36).slice(2)}`;
let user;
let report;

describe('MongoDB report persistence smoke test', async () => {
  await mongoose.connect(mongoUri);

  user = await User.create({
    name: 'SafePath CI',
    email: `${testId}@example.com`,
    passwordHash: 'integration-test-hash',
    role: 'user'
  });

  report = await Report.create({
    reporter: user._id,
    imageUrl: `https://example.com/reports/${testId}.jpg`,
    location: { lat: 18.5204, lng: 73.8567, address: 'Pune' },
    description: 'Integration-test pothole report',
    ai: {
      available: true,
      detected: true,
      confidence: 0.91,
      detections: [{ class: 'pothole', confidence: 0.91, box: [10, 20, 100, 120] }]
    }
  });

  const stored = await Report.findById(report._id).populate('reporter', 'name');
  assert.ok(stored);
  assert.equal(stored.reporter.name, 'SafePath CI');
  assert.equal(stored.imageUrl, `https://example.com/reports/${testId}.jpg`);
  assert.equal(stored.location.lat, 18.5204);
  assert.equal(stored.location.lng, 73.8567);
  assert.equal(stored.ai.detected, true);
  assert.equal(stored.ai.detections[0].class, 'pothole');
});

after(async () => {
  if (!shouldRun) return;
  if (report) await Report.deleteOne({ _id: report._id });
  if (user) await User.deleteOne({ _id: user._id });
  await mongoose.disconnect();
});
