'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/client';
import { createSession, sessionCookieOptions } from '@/lib/auth/session';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
} from '@/lib/auth/rate-limit';

export type JoinState =
  | null
  | { error: string; attemptsLeft?: number }
  | { needsPin: true; name: string }   // existing user, show PIN prompt
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

  // ── Returning user: name is taken, PIN required ──────────────────────────
  if (existingUser) {
    if (!pin) {
      return { needsPin: true, name };
    }

    const { allowed, attemptsLeft, lockedUntilMs } = checkRateLimit(name);
    if (!allowed) {
      const mins = lockedUntilMs
        ? Math.ceil((lockedUntilMs - Date.now()) / 60000)
        : 15;
      return { error: `Too many attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` };
    }

    const valid = await bcrypt.compare(pin, existingUser.pin_hash);
    if (!valid) {
      const left = recordFailedAttempt(name);
      return {
        error: left === 0
          ? 'Too many failed attempts. Locked for 15 minutes.'
          : 'Wrong PIN',
        attemptsLeft: left,
      };
    }

    clearAttempts(name);

    const pinReset = existingUser.pin_reset === 1;
    const signed = await createSession(existingUser.id, pinReset);
    const cookieStore = await cookies();
    cookieStore.set({ value: signed, ...sessionCookieOptions() });

    redirect(pinReset ? '/set-pin' : '/');
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
