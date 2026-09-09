import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { validateObjectId, validateReportInput } from '../src/middleware/validate.js';
import { auth, authorityOnly } from '../src/middleware/auth.js';
import Report from '../src/models/Report.js';

function responseMock() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('validateReportInput accepts a valid report payload', () => {
  const req = {
    body: { lat: '18.5204', lng: '73.8567', address: 'Pune', description: 'Large pothole' },
    file: { mimetype: 'image/jpeg' }
  };
  const res = responseMock();
  let called = false;
  validateReportInput(req, res, () => { called = true; });

  assert.equal(called, true);
  assert.deepEqual(req.validatedReport, {
    lat: 18.5204,
    lng: 73.8567,
    address: 'Pune',
    description: 'Large pothole'
  });
});

test('validateReportInput rejects invalid coordinates', () => {
  const req = {
    body: { lat: '91', lng: '73.8567', address: '', description: '' },
    file: { mimetype: 'image/jpeg' }
  };
  const res = responseMock();
  let called = false;
  validateReportInput(req, res, () => { called = true; });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Latitude must be between -90 and 90');
  assert.equal(called, false);
});

test('validateReportInput requires an image', () => {
  const req = { body: { lat: '18', lng: '73', address: '', description: '' } };
  const res = responseMock();
  validateReportInput(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'A road image is required');
});

test('validateObjectId rejects malformed report ids', () => {
  const req = { params: { id: 'not-an-object-id' } };
  const res = responseMock();
  validateObjectId(req, res, () => { throw new Error('next should not run'); });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Invalid report id');
});

test('Report schema rejects coordinates outside geographic bounds', () => {
  const report = new Report({
    reporter: new mongoose.Types.ObjectId(),
    imageUrl: 'https://example.com/report.jpg',
    location: { lat: 100, lng: 73.8 }
  });
  const error = report.validateSync();

  assert.ok(error);
  assert.match(error.errors['location.lat'].message, /maximum allowed value \(90\)/);
});

test('auth accepts a valid bearer token', () => {
  const original = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'unit-test-secret';
  const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'user', email: 'user@example.com' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = responseMock();
  let called = false;
  auth(req, res, () => { called = true; });
  if (original === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = original;

  assert.equal(called, true);
  assert.equal(req.user.role, 'user');
});

test('authorityOnly blocks normal users', () => {
  const req = { user: { role: 'user' } };
  const res = responseMock();
  authorityOnly(req, res, () => { throw new Error('next should not run'); });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'Authority access required');
});
