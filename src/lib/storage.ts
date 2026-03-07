import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// Initialize the S3 client for Primary Account (Profiles, Receipts)
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

// Initialize the S3 client for Secondary Account (Social Feed, Stories)
// Fallback to primary account if social keys aren't provided yet
const socialR2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.SOCIAL_CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.SOCIAL_CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.SOCIAL_CLOUDFLARE_R2_ACCESS_KEY || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SOCIAL_CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.SOCIAL_CLOUDFLARE_R2_SECRET || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Uploads a File object to Cloudflare R2 and returns the public URL.
 * Requires NEXT_PUBLIC_R2_DOMAIN and CLOUDFLARE_R2_BUCKET_NAME to be set.
 */
export async function uploadToR2(file: File): Promise<string> {
  if (!file || file.size === 0) return '';
  
  if (!process.env.CLOUDFLARE_R2_BUCKET_NAME) {
    console.warn('[Storage] Missing R2 Bucket Name. Cannot upload file.');
    return '';
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Extract extension or fallback
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${randomUUID()}.${ext}`;

    await r2.send(new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    }));

    const domain = process.env.NEXT_PUBLIC_R2_DOMAIN || '';
    if (!domain) {
        console.warn('[Storage] Missing NEXT_PUBLIC_R2_DOMAIN. Returning relative path.');
        return `/${fileName}`;
    }

    // Ensure we don't double slash
    const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
    return `${cleanDomain}/${fileName}`;
    
  } catch (error) {
    console.error('[Storage] S3 Upload Error:', error);
    return '';
  }
}

/**
 * Uploads a File object to the SECONDARY Cloudflare R2 account (Social Feed).
 * Fallbacks to the primary bucket if social tokens are missing.
 */
export async function uploadToSocialR2(file: File): Promise<string> {
  if (!file || file.size === 0) return '';
  
  const bucketName = process.env.SOCIAL_CLOUDFLARE_R2_BUCKET_NAME || process.env.SOCIAL_CLOUDFLARE_R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET_NAME;
  
  if (!bucketName) {
    console.warn('[Storage] Missing Social R2 Bucket Name. Cannot upload file.');
    return '';
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${randomUUID()}.${ext}`;

    await socialR2.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    }));

    const domain = process.env.SOCIAL_NEXT_PUBLIC_R2_DOMAIN || process.env.NEXT_PUBLIC_R2_DOMAIN || '';
    if (!domain) {
        console.warn('[Storage] Missing SOCIAL_NEXT_PUBLIC_R2_DOMAIN. Returning relative path.');
        return `/${fileName}`;
    }

    const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
    return `${cleanDomain}/${fileName}`;
    
  } catch (error) {
    console.error('[Storage] Social S3 Upload Error:', error);
    return '';
  }
}
