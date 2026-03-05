'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/client';
import { createSession, sessionCookieOptions } from '@/lib/auth/session';

export type JoinState =
  | null
  | { error: string; attemptsLeft?: number }
  | { nameTaken: true; name: string }  // existing user, show login link
  | { newUser: true; name: string };   // new user, show PIN + confirm

export async function joinClub(
  prev: JoinState,
  formData: FormData,
): Promise<JoinState | never> {
  const name = (formData.get('name') as string)?.trim();
  const pin = formData.get('pin') as string;
  const confirmPin = formData.get('confirmPin') as string;

  if (!name) return { error: 'Name is required' };

  const existingUser = await db
    .selectFrom('users')
    .select(['id', 'pin_hash', 'pin_reset'])
    .where('name', '=', name)
    .executeTakeFirst();

  // ── Name taken: redirect to login ─────────────────────────────────────────
  if (existingUser) {
    return { nameTaken: true, name };
  }

  // ── New user: claim name + set PIN ───────────────────────────────────────
  // Step 1 for new user: reveal PIN + confirm fields
  if (!pin) return { newUser: true, name };
  if (!/^\d{4,6}$/.test(pin)) return { error: 'PIN must be 4-6 digits' };
  if (pin !== confirmPin) return { error: 'PINs do not match' };

  const pinHash = await bcrypt.hash(pin, 10);

  try {
    const result = await db
      .insertInto('users')
      .values({ name, pin_hash: pinHash, pin_reset: 0 })
      .returning('id')
      .executeTakeFirstOrThrow();

    const signed = await createSession(result.id);
    const cookieStore = await cookies();
    cookieStore.set({ value: signed, ...sessionCookieOptions() });
  } catch {
    return { error: 'That name is already taken' };
  }

  redirect('/');
}
