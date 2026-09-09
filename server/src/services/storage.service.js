import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const bucket = process.env.S3_BUCKET;
const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '');
const client = bucket ? new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  } : undefined
}) : null;

export async function storeImage(file) {
  if (!client || !bucket) throw new Error('Production image storage is not configured');
  const extension = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
  const key = `reports/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype, CacheControl: 'public, max-age=31536000, immutable' }));
  if (!publicBaseUrl) throw new Error('S3_PUBLIC_BASE_URL is required for report image URLs');
  return `${publicBaseUrl}/${key}`;
}

export function storageConfigured() {
  return Boolean(client && bucket && publicBaseUrl);
}
