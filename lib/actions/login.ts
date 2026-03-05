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

export type LoginState =
  | null
  | { error: string; attemptsLeft?: number }
  | { needsPin: true; name: string };

export async function loginUser(
  prev: LoginState,
  formData: FormData,
): Promise<LoginState | never> {
  const name = (formData.get('name') as string)?.trim();
  const pin = formData.get('pin') as string;

  if (!name) return { error: 'Name is required' };

  const existingUser = await db
    .selectFrom('users')
    .select(['id', 'pin_hash', 'pin_reset'])
    .where('name', '=', name)
    .executeTakeFirst();

  if (!existingUser) {
    return { error: 'No account found with that name' };
  }

  if (!pin) {
    return { needsPin: true, name };
  }

  const { allowed, lockedUntilMs } = checkRateLimit(name);
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
