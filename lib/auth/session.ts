import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/client';
import { signCookie, verifyCookie } from './cookies';

const SESSION_COOKIE = 'bc_session';
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days in seconds

function sha256(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  userId: number,
  pinReset = false,
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(rawToken);

  await db
    .insertInto('sessions')
    .values({ token_hash: tokenHash, user_id: userId, last_seen: Math.floor(Date.now() / 1000) })
    .execute();

  const payload: Record<string, unknown> = {
    type: 'session',
    token: rawToken,
    iat: Date.now(),
  };
  if (pinReset) payload.pinReset = true;

  return signCookie(payload);
}

export type SessionData = {
  userId: number;
  name: string;
  pinReset: boolean;
};

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const payload = (await verifyCookie(raw)) as Record<string, unknown> | null;
  if (!payload || payload.type !== 'session' || typeof payload.token !== 'string') {
    return null;
  }

  const tokenHash = sha256(payload.token);
  const now = Math.floor(Date.now() / 1000);

  const row = await db
    .selectFrom('sessions')
    .innerJoin('users', 'users.id', 'sessions.user_id')
    .select(['sessions.id', 'sessions.token_hash', 'users.id as userId', 'users.name', 'users.pin_reset'])
    .where('sessions.token_hash', '=', tokenHash)
    .executeTakeFirst();

  if (!row) return null;

  // Update last_seen
  await db
    .updateTable('sessions')
    .set({ last_seen: now })
    .where('token_hash', '=', tokenHash)
    .execute();

  return {
    userId: row.userId,
    name: row.name,
    pinReset: payload.pinReset === true || row.pin_reset === 1,
  };
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await db.deleteFrom('sessions').where('token_hash', '=', tokenHash).execute();
}

export function sessionCookieOptions(maxAge = MAX_AGE) {
  return {
    name: SESSION_COOKIE,
    maxAge,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}
