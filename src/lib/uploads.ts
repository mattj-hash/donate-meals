import path from 'node:path';
import { MAX_PHOTO_UPLOADS, MAX_UPLOAD_MB } from '@/lib/constants';
import { randomToken } from '@/lib/security';
import { buildStorageKey, uploadObject } from '@/lib/storage';
import { addDonationPhoto } from '@/lib/repositories/donations';

const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40);
  return `${base || 'file'}${ext || ''}`;
}

export function validateMealPhotos(files: File[], requireAtLeastOne = true) {
  if (requireAtLeastOne && files.length < 1) {
    throw new Error('At least one meal photo is required.');
  }

  if (files.length > MAX_PHOTO_UPLOADS) {
    throw new Error(`You can upload up to ${MAX_PHOTO_UPLOADS} meal photos.`);
  }

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Meal photos must be image files.');
    }

    if (file.size > MAX_BYTES) {
      throw new Error(`Each photo must be ${MAX_UPLOAD_MB}MB or smaller.`);
    }
  }
}

export function validateInvoice(file: File | null) {
  if (!file || file.size === 0) return;

  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowed.includes(file.type)) {
    throw new Error('Invoice/packing slip must be PDF or image.');
  }

  if (file.size > MAX_BYTES) {
    throw new Error(`Invoice/packing slip must be ${MAX_UPLOAD_MB}MB or smaller.`);
  }
}

export async function uploadDonationAssets(input: {
  donationId: string;
  photos: File[];
  invoice: File | null;
}) {
  for (const photo of input.photos) {
    const bytes = Buffer.from(await photo.arrayBuffer());
    const fileName = sanitizeFileName(photo.name || 'meal-photo.jpg');
    const key = buildStorageKey([
      'donations',
      input.donationId,
      'photos',
      `${Date.now()}-${randomToken(8)}-${fileName}`
    ]);

    await uploadObject({
      key,
      body: bytes,
      contentType: photo.type || 'image/jpeg'
    });

    await addDonationPhoto({
      donationId: input.donationId,
      kind: 'meal_photo',
      fileName,
      mimeType: photo.type || 'image/jpeg',
      sizeBytes: photo.size,
      s3Key: key
    });
  }

  if (input.invoice && input.invoice.size > 0) {
    const invoiceBytes = Buffer.from(await input.invoice.arrayBuffer());
    const fileName = sanitizeFileName(input.invoice.name || 'invoice.pdf');
    const key = buildStorageKey([
      'donations',
      input.donationId,
      'invoice',
      `${Date.now()}-${randomToken(8)}-${fileName}`
    ]);

    await uploadObject({
      key,
      body: invoiceBytes,
      contentType: input.invoice.type || 'application/octet-stream'
    });

    await addDonationPhoto({
      donationId: input.donationId,
      kind: 'invoice',
      fileName,
      mimeType: input.invoice.type || 'application/octet-stream',
      sizeBytes: input.invoice.size,
      s3Key: key
    });
  }
}
