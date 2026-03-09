import { createSignedToken, verifySignedToken } from '@/lib/security';

type ReceiptDownloadPayload = {
  type: 'receipt_download';
  receiptCode: string;
  email: string;
  exp: number;
};

export function createReceiptDownloadToken(receiptCode: string, email: string, ttlSeconds = 60 * 60 * 24 * 14) {
  return createSignedToken(
    {
      type: 'receipt_download',
      receiptCode,
      email: email.toLowerCase()
    },
    ttlSeconds
  );
}

export function verifyReceiptDownloadToken(token: string, receiptCode: string, email: string) {
  const payload = verifySignedToken<ReceiptDownloadPayload>(token);
  if (!payload || payload.type !== 'receipt_download') {
    return false;
  }

  return (
    payload.receiptCode === receiptCode &&
    payload.email.toLowerCase() === email.toLowerCase()
  );
}
