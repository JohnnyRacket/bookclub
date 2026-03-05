'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signCookie } from '@/lib/auth/cookies';

const GATE_COOKIE = 'bc_gate';
const MAX_AGE = 60 * 60 * 24 * 90;

export async function enterClub(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | never> {
  const password = formData.get('password') as string;

  if (password !== process.env.CLUB_PASSWORD) {
    return { error: 'Wrong password' };
  }

  const signed = await signCookie({ type: 'gate', iat: Date.now() });
  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE, signed, {
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  redirect('/join');
}
