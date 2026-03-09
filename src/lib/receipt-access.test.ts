import { describe, expect, it } from 'vitest';
import { createReceiptDownloadToken, verifyReceiptDownloadToken } from './receipt-access';

describe('receipt download token', () => {
  it('validates token against receipt code and email', () => {
    const token = createReceiptDownloadToken('RF-2026-ABC1234', 'donor@example.com', 60);
    const ok = verifyReceiptDownloadToken(token, 'RF-2026-ABC1234', 'donor@example.com');
    expect(ok).toBe(true);
  });

  it('fails for wrong email', () => {
    const token = createReceiptDownloadToken('RF-2026-ABC1234', 'donor@example.com', 60);
    const ok = verifyReceiptDownloadToken(token, 'RF-2026-ABC1234', 'other@example.com');
    expect(ok).toBe(false);
  });
});
