import { getConfig } from '@/lib/config';

export function appUrl(pathname: string) {
  const base = getConfig().APP_URL.replace(/\/$/, '');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}
