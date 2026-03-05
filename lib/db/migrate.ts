import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      pin_hash   TEXT    NOT NULL,
      pin_reset  INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT    NOT NULL UNIQUE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      last_seen  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS books (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      status       TEXT    NOT NULL DEFAULT 'submitted',
      title        TEXT    NOT NULL,
      author       TEXT    NOT NULL,
      cover_url    TEXT,
      pages        INTEGER,
      year         INTEGER,
      genres       TEXT,
      ol_key       TEXT,
      submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
      archived_at  INTEGER
    );

    CREATE TABLE IF NOT EXISTS book_thumbs (
      book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      value      INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (book_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS book_reacts (
      book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      emoji      TEXT    NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (book_id, user_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS ol_cache (
      cache_key TEXT    PRIMARY KEY,
      data      TEXT    NOT NULL,
      cached_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS club_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_books_status     ON books(status);
    CREATE INDEX IF NOT EXISTS idx_book_thumbs_book ON book_thumbs(book_id);
    CREATE INDEX IF NOT EXISTS idx_book_reacts_book ON book_reacts(book_id);
  `);
}
