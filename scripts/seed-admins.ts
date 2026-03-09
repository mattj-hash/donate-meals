import postgres from 'postgres';
import { DEFAULT_ADMIN_ALLOWLIST } from '../src/lib/constants';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed admin users.');
}

const useSsl = !/(localhost|127\\.0\\.0\\.1)/i.test(databaseUrl);
const sql = postgres(databaseUrl, { ssl: useSsl ? 'require' : undefined, max: 1 });

async function main() {
  for (const email of DEFAULT_ADMIN_ALLOWLIST) {
    await sql`
      INSERT INTO admin_users (email, active)
      VALUES (${email.toLowerCase()}, TRUE)
      ON CONFLICT (email) DO UPDATE SET active = TRUE
    `;
  }
  console.log('Seeded admin allowlist.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 1 });
  });
