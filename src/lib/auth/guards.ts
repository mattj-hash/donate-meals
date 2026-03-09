import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getAdminSession, getDonorSession } from '@/lib/auth/session';
import { isAdminAllowed } from '@/lib/repositories/donations';

export async function requireAdminPageSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const allowed = await isAdminAllowed(session.email);
  if (!allowed) {
    redirect('/admin/login?error=not-authorized');
  }

  return session;
}

export async function requireAdminApiSession() {
  const session = await getAdminSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  const allowed = await isAdminAllowed(session.email);
  if (!allowed) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    };
  }

  return { session };
}

export async function getDonorSessionForDonation(donationId: string, donorEmail: string) {
  const session = await getDonorSession();
  if (!session) return null;
  if (session.donationId !== donationId) return null;
  if (session.email.toLowerCase() !== donorEmail.toLowerCase()) return null;
  return session;
}
