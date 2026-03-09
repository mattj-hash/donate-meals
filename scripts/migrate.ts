import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations.');
}

const useSsl = !/(localhost|127\\.0\\.0\\.1)/i.test(databaseUrl);
const sql = postgres(databaseUrl, { ssl: useSsl ? 'require' : undefined, max: 1 });

async function ensureMigrationTable() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function main() {
  await ensureMigrationTable();

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const applied = await sql<{ version: string }[]>`SELECT version FROM schema_migrations`;
  const appliedSet = new Set(applied.map((row) => row.version));

  for (const file of files) {
    if (appliedSet.has(file)) continue;
    const filePath = path.join(migrationsDir, file);
    const contents = await readFile(filePath, 'utf8');

    await sql.begin(async (tx) => {
      await tx.unsafe(contents);
      await tx`INSERT INTO schema_migrations (version) VALUES (${file})`;
    });

    console.log(`Applied migration: ${file}`);
  }

  console.log('Migration complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 1 });
  });
