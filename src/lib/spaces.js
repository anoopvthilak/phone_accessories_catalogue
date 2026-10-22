import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const region = process.env.DO_SPACES_REGION || 'blr1';
const bucket = process.env.NEXT_PUBLIC_APP_BUCKET_NAME || 'cellularworld';
const cdnUrl = process.env.NEXT_PUBLIC_APP_CDN_URL || `https://${bucket}.${region}.cdn.digitaloceanspaces.com`;

let s3ClientInstance = null;

export function getS3Client() {
  if (!s3ClientInstance) {
    const accessKeyId = process.env.DO_SPACES_ACCESS_KEY;
    const secretAccessKey = process.env.DO_SPACES_SECRET_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('DigitalOcean Spaces credentials are not configured');
    }

    s3ClientInstance = new S3Client({
      endpoint: `https://${region}.digitaloceanspaces.com`,
      region: 'us-east-1', // Required by AWS S3 client for S3-compatible endpoints
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3ClientInstance;
}

/**
 * Upload a product image buffer to DigitalOcean Spaces
 * @param {Buffer|Uint8Array} buffer 
 * @param {string} originalFilename 
 * @param {string} contentType 
 * @returns {Promise<{ url: string, key: string }>}
 */
export async function uploadToSpaces(buffer, originalFilename, contentType) {
  const s3 = getS3Client();

  // Sanitize filename and extract extension
  const safeExtMatch = originalFilename.match(/\.([a-zA-Z0-9]+)$/);
  const ext = safeExtMatch ? safeExtMatch[1].toLowerCase() : 'jpg';
  const cleanBaseName = originalFilename
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);

  const uniqueId = crypto.randomBytes(6).toString('hex');
  const key = `products/${Date.now()}-${uniqueId}-${cleanBaseName}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ACL: 'public-read',
    ContentType: contentType || 'image/jpeg',
  });

  await s3.send(command);

  // Clean CDN URL base
  const cleanCdn = cdnUrl.replace(/\/+$/, '');
  const publicUrl = `${cleanCdn}/${key}`;

  return {
    url: publicUrl,
    key,
  };
}

/**
 * Extract storage Key from public URL or return key directly
 * @param {string} keyOrUrl 
 * @returns {string|null}
 */
export function extractKeyFromUrl(keyOrUrl) {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return null;

  // If it's already a clean key like "products/..."
  if (!keyOrUrl.startsWith('http://') && !keyOrUrl.startsWith('https://')) {
    return keyOrUrl.replace(/^\/+/, '');
  }

  try {
    const parsed = new URL(keyOrUrl);
    // Pathname starts with '/', slice it off
    const path = parsed.pathname.replace(/^\/+/, '');
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL belongs to our DigitalOcean Spaces / CDN
 * @param {string} url 
 * @returns {boolean}
 */
export function isSpacesUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('.digitaloceanspaces.com') ||
    (cdnUrl && url.startsWith(cdnUrl.replace(/\/+$/, '')))
  );
}

/**
 * Delete an object from DigitalOcean Spaces
 * @param {string} keyOrUrl 
 * @returns {Promise<boolean>}
 */
export async function deleteFromSpaces(keyOrUrl) {
  const key = extractKeyFromUrl(keyOrUrl);
  if (!key) return false;

  try {
    const s3 = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await s3.send(command);
    return true;
  } catch (error) {
    console.error('Failed to delete file from Spaces:', key, error);
    return false;
  }
}
