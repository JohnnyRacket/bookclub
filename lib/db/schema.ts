import type { ColumnType, Generated, Selectable, Insertable } from 'kysely';

export interface UsersTable {
  id: Generated<number>;
  name: string;
  pin_hash: string;
  pin_reset: number; // 0 or 1
  created_at: Generated<number>;
}

export interface SessionsTable {
  id: Generated<number>;
  token_hash: string;
  user_id: number;
  created_at: Generated<number>;
  last_seen: ColumnType<number, number | undefined, number>;
}

export interface BooksTable {
  id: Generated<number>;
  status: string; // 'current' | 'past' | 'submitted'
  title: string;
  author: string;
  cover_url: string | null;
  pages: number | null;
  year: number | null;
  genres: string | null; // JSON array string e.g. '["Fiction"]'
  ol_key: string | null;
  submitted_by: number | null;
  created_at: Generated<number>;
  archived_at: number | null;
}

export interface BookThumbsTable {
  book_id: number;
  user_id: number;
  value: number; // 1 or -1
  created_at: number;
}

export interface BookReactsTable {
  book_id: number;
  user_id: number;
  emoji: string;
  created_at: number;
}

export interface OlCacheTable {
  cache_key: string;
  data: string; // JSON
  cached_at: number;
}

export interface ClubSettingsTable {
  key: string;
  value: string;
}

export interface CustomReactionsTable {
  id: Generated<number>;
  image_path: string;
  label: string | null;
  uploaded_by: number | null;
  created_at: Generated<string>;
}

export interface DB {
  users: UsersTable;
  sessions: SessionsTable;
  books: BooksTable;
  book_thumbs: BookThumbsTable;
  book_reacts: BookReactsTable;
  ol_cache: OlCacheTable;
  club_settings: ClubSettingsTable;
  custom_reactions: CustomReactionsTable;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type Session = Selectable<SessionsTable>;
export type Book = Selectable<BooksTable>;
