import { toSlugToken } from '@/lib/utils';

export function generateReceiptCode(date = new Date()) {
  const year = date.getUTCFullYear();
  return `RF-${year}-${toSlugToken(7)}`;
}
