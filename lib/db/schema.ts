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

export interface DB {
  users: UsersTable;
  sessions: SessionsTable;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type Session = Selectable<SessionsTable>;
