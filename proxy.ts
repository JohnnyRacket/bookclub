import { NextRequest, NextResponse } from 'next/server';
import { verifyCookieEdge } from '@/lib/auth/cookies-edge';

const GATE_COOKIE = 'bc_gate';
const SESSION_COOKIE = 'bc_session';
const ADMIN_COOKIE = 'bc_admin';
const MAX_AGE = 60 * 60 * 24 * 90;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|covers/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET ?? '';

  // Always allow /enter
  if (pathname === '/enter') {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const isSecure = process.env.NODE_ENV === 'production';

  // ── Gate check ────────────────────────────────────────────────────────────
  const gateRaw = req.cookies.get(GATE_COOKIE)?.value;
  const gatePayload = gateRaw ? await verifyCookieEdge(gateRaw, secret) : null;
  if (!gatePayload) {
    return NextResponse.redirect(new URL('/enter', req.url));
  }

  // Refresh gate cookie (sliding expiry)
  res.cookies.set(GATE_COOKIE, gateRaw!, {
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
  });

  // /join and /login only need a valid gate
  if (pathname === '/join' || pathname === '/login') {
    return res;
  }

  // ── Admin check ───────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return res;

    const adminRaw = req.cookies.get(ADMIN_COOKIE)?.value;
    const adminPayload = adminRaw
      ? await verifyCookieEdge(adminRaw, secret)
      : null;

    if (!adminPayload || (adminPayload as Record<string, unknown>).type !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return res;
  }

  // ── Session check ─────────────────────────────────────────────────────────
  const sessionRaw = req.cookies.get(SESSION_COOKIE)?.value;
  const sessionPayload = sessionRaw
    ? ((await verifyCookieEdge(sessionRaw, secret)) as Record<string, unknown> | null)
    : null;

  if (!sessionPayload || sessionPayload.type !== 'session') {
    return NextResponse.redirect(new URL('/join', req.url));
  }

  // Refresh session cookie (sliding expiry)
  res.cookies.set(SESSION_COOKIE, sessionRaw!, {
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    path: '/',
  });

  // ── Force PIN reset ───────────────────────────────────────────────────────
  if (sessionPayload.pinReset === true && pathname !== '/set-pin') {
    return NextResponse.redirect(new URL('/set-pin', req.url));
  }

  return res;
}
