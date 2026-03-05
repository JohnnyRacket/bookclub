import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { DB } from './schema';
import { runMigrations } from './migrate';

function createDb() {
  const sqlite = new Database(process.env.DATABASE_URL ?? './bookclub.db');
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
