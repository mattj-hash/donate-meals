import crypto from 'node:crypto';
import { getConfig } from '@/lib/config';

const TOKEN_PREFIX = 'v1';

type TokenPayload = Record<string, unknown> & {
  exp: number;
};

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const withPadding = normalized + (pad ? '='.repeat(4 - pad) : '');
  return Buffer.from(withPadding, 'base64').toString('utf8');
}

function sign(value: string, secret: string) {
  return base64UrlEncode(crypto.createHmac('sha256', secret).update(value).digest());
}

export function createSignedToken(payload: Omit<TokenPayload, 'exp'>, ttlSeconds: number, secret?: string) {
  const secretValue = secret ?? getConfig().TOKEN_SECRET;
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const toSign = `${TOKEN_PREFIX}.${encodedPayload}`;
  const signature = sign(toSign, secretValue);
  return `${toSign}.${signature}`;
}

export function verifySignedToken<T extends TokenPayload>(token: string, secret?: string): T | null {
  const secretValue = secret ?? getConfig().TOKEN_SECRET;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [prefix, encodedPayload, signature] = parts;
  if (prefix !== TOKEN_PREFIX) return null;

  const toSign = `${prefix}.${encodedPayload}`;
  const expectedSignature = sign(toSign, secretValue);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as T;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function randomToken(length = 32) {
  return crypto.randomBytes(length).toString('base64url');
}

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
