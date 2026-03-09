import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/auth/session';

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url));
  clearAdminSessionCookie(response);
  return response;
}
