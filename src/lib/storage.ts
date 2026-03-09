import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getConfig } from '@/lib/config';

const config = getConfig();

const s3 = new S3Client({
  endpoint: config.S3_ENDPOINT,
  region: config.S3_REGION,
  forcePathStyle: config.S3_FORCE_PATH_STYLE === 'true',
  credentials: {
    accessKeyId: config.S3_ACCESS_KEY_ID,
    secretAccessKey: config.S3_SECRET_ACCESS_KEY
  }
});

export async function uploadObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
  contentDisposition?: string;
}) {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ContentDisposition: params.contentDisposition
    })
  );

  return { key: params.key };
}

export async function getSignedObjectUrl(key: string, expiresInSeconds = 900) {
  const command = new GetObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: key
  });

  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

export function buildStorageKey(parts: string[]) {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/')
    .replace(/[^a-zA-Z0-9_./-]/g, '-');
}
