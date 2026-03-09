import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSignedToken, verifySignedToken } from '@/lib/security';

const ADMIN_COOKIE = 'rf_admin_session';
const DONOR_COOKIE = 'rf_donor_session';

type AdminSession = {
  role: 'admin';
  email: string;
  exp: number;
};

type DonorSession = {
  role: 'donor';
  email: string;
  donationId: string;
  exp: number;
};

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

export function setAdminSessionCookie(response: NextResponse, email: string) {
  const token = createSignedToken({ role: 'admin', email: email.toLowerCase() }, 60 * 60 * 24 * 7);
  response.cookies.set(ADMIN_COOKIE, token, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!value) return null;
  const parsed = verifySignedToken<AdminSession>(value);
  if (!parsed || parsed.role !== 'admin') return null;
  return parsed;
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.delete(ADMIN_COOKIE);
}

export function setDonorSessionCookie(response: NextResponse, email: string, donationId: string) {
  const token = createSignedToken(
    {
      role: 'donor',
      email: email.toLowerCase(),
      donationId
    },
    60 * 60 * 24 * 30
  );

  response.cookies.set(DONOR_COOKIE, token, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function getDonorSession(): Promise<DonorSession | null> {
  const store = await cookies();
  const value = store.get(DONOR_COOKIE)?.value;
  if (!value) return null;
  const parsed = verifySignedToken<DonorSession>(value);
  if (!parsed || parsed.role !== 'donor') return null;
  return parsed;
}
