import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObjectId, validateReportInput } from '../src/middleware/validate.js';

function response() {
  return { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('rejects invalid latitude', () => {
  const req = { body: { lat: '95', lng: '73' }, file: { mimetype: 'image/jpeg' } };
  const res = response(); let called = false;
  validateReportInput(req, res, () => { called = true; });
  assert.equal(res.statusCode, 400); assert.equal(called, false);
});

test('accepts valid report payload', () => {
  const req = { body: { lat: '18.5204', lng: '73.8567', address: 'Pune', description: 'Large pothole' }, file: { mimetype: 'image/jpeg' } };
  const res = response(); let called = false;
  validateReportInput(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.deepEqual(req.validatedReport, { lat: 18.5204, lng: 73.8567, address: 'Pune', description: 'Large pothole' });
});

test('rejects malformed Mongo report id', () => {
  const req = { params: { id: 'not-an-object-id' } }; const res = response(); let called = false;
  validateObjectId(req, res, () => { called = true; });
  assert.equal(res.statusCode, 400); assert.equal(called, false);
});

test('accepts a valid Mongo report id', () => {
  const req = { params: { id: '507f1f77bcf86cd799439011' } }; const res = response(); let called = false;
  validateObjectId(req, res, () => { called = true; });
  assert.equal(called, true);
});
