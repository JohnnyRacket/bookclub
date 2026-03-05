'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signCookie, verifyCookie } from '@/lib/auth/cookies';
import { db } from '@/lib/db/client';

const ADMIN_COOKIE = 'bc_admin';

export async function verifyAdmin(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | never> {
  const pin = formData.get('pin') as string;
  if (pin !== process.env.ADMIN_PIN) {
    return { error: 'Wrong admin PIN' };
  }

  const signed = await signCookie({ type: 'admin', iat: Date.now() });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, signed, {
    maxAge: 60 * 60, // 1 hour
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
  });

  redirect('/admin');
}

export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!raw) redirect('/admin/login');

  const payload = (await verifyCookie(raw)) as Record<string, unknown> | null;
  if (!payload || payload.type !== 'admin') redirect('/admin/login');
}

export type MemberRow = {
  id: number;
  name: string;
  pin_reset: number;
  created_at: number;
  sessionCount: number;
};

export async function listMembers(): Promise<MemberRow[]> {
  await requireAdmin();

  const rows = await db
    .selectFrom('users')
    .leftJoin('sessions', 'sessions.user_id', 'users.id')
    .select([
      'users.id',
      'users.name',
      'users.pin_reset',
      'users.created_at',
      db.fn.count<number>('sessions.id').as('sessionCount'),
    ])
    .groupBy('users.id')
    .orderBy('users.name', 'asc')
    .execute();

  return rows.map((r) => ({ ...r, sessionCount: Number(r.sessionCount) }));
}

export async function deleteUserSessions(userId: number): Promise<void> {
  await requireAdmin();
  await db.deleteFrom('sessions').where('user_id', '=', userId).execute();
}

export async function resetUserPin(userId: number): Promise<void> {
  await requireAdmin();
  // Delete all sessions first (forces re-login)
  await db.deleteFrom('sessions').where('user_id', '=', userId).execute();
  // Mark pin_reset = 1
  await db
    .updateTable('users')
    .set({ pin_reset: 1 })
    .where('id', '=', userId)
    .execute();
}
