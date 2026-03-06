'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signCookie, verifyCookie } from '@/lib/auth/cookies';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

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
    path: '/',
  });

  redirect('/admin');
}

export async function verifyAdminPinOnly(pin: string): Promise<{ error?: string; success?: boolean }> {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin || pin !== adminPin) return { error: 'Incorrect PIN' };
  const cookieStore = await cookies();
  const signed = await signCookie({ type: 'admin', iat: Date.now() });
  cookieStore.set(ADMIN_COOKIE, signed, {
    maxAge: 60 * 60,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return { success: true };
}

export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!raw) redirect('/admin/login');

  const payload = (await verifyCookie(raw)) as Record<string, unknown> | null;
  if (!payload || payload.type !== 'admin') redirect('/admin/login');
}

export async function isPinlessMode(): Promise<boolean> {
  if (!process.env.ADMIN_PIN) return true;
  const row = await db
    .selectFrom('club_settings')
    .select('value')
    .where('key', '=', 'pinless_admin')
    .executeTakeFirst();
  return row?.value === '1';
}

export async function elevateToAdmin(): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: 'Not authenticated' };

  const pinless = await isPinlessMode();
  if (!pinless) return { error: 'PIN required' };

  const signed = await signCookie({ type: 'admin', iat: Date.now() });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, signed, {
    maxAge: 60 * 60,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return { success: true };
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;

  const payload = (await verifyCookie(raw)) as Record<string, unknown> | null;
  return !!(payload && payload.type === 'admin');
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
