import postgres from 'postgres';
import { getConfig } from '@/lib/config';

const config = getConfig();
const useSsl = !/(localhost|127\\.0\\.0\\.1)/i.test(config.DATABASE_URL);

export const sql = postgres(config.DATABASE_URL, {
  prepare: false,
  max: 10,
  ssl: useSsl ? 'require' : undefined
});
