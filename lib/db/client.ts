import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type { DB } from './schema';
import { runMigrations } from './migrate';

function createDb() {
  const dbPath = process.env.DATABASE_URL ?? '/app/data/bookclub.db';
  // Ensure the directory exists (important in Docker where data dirs may not exist at build time)
  const dir = dirname(dbPath);
  if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  runMigrations(sqlite);
  return new Kysely<DB>({
    dialect: new SqliteDialect({ database: sqlite }),
  });
}

// Singleton — reuse across hot reloads in dev
const globalForDb = global as typeof global & { db?: Kysely<DB> };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
