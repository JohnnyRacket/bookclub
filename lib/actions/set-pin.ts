'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/client';
import { getSession, createSession, sessionCookieOptions } from '@/lib/auth/session';

export async function setPin(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | never> {
  const session = await getSession();
  if (!session || !session.pinReset) {
    redirect('/join');
  }

  const pin = formData.get('pin') as string;
  const confirmPin = formData.get('confirmPin') as string;

  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return { error: 'PIN must be 4-6 digits' };
  }
  if (pin !== confirmPin) {
    return { error: 'PINs do not match' };
  }

  const pinHash = await bcrypt.hash(pin, 10);
  await db
    .updateTable('users')
    .set({ pin_hash: pinHash, pin_reset: 0 })
    .where('id', '=', session.userId)
    .execute();

  // Issue a fresh session without the pinReset flag
  const signed = await createSession(session.userId, false);
  const cookieStore = await cookies();
  cookieStore.set({ value: signed, ...sessionCookieOptions() });

  redirect('/');
}
