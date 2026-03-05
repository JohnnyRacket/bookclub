/**
 * HMAC-signed cookie helpers (Node.js only).
 * - signCookie / verifyCookie: Node crypto (server actions, server components)
 *
 * For Edge runtime (middleware), use lib/auth/cookies-edge.ts instead.
 *
 * Cookie format: <base64url(JSON payload)>.<hmac_hex>
 */

import crypto from 'crypto';

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return secret;
}

function toBase64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function fromBase64url(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8');
}

export async function signCookie(payload: object): Promise<string> {
  const encoded = toBase64url(JSON.stringify(payload));
  const hmac = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('hex');
  return `${encoded}.${hmac}`;
}

export async function verifyCookie(value: string): Promise<object | null> {
  try {
    const dotIndex = value.lastIndexOf('.');
    if (dotIndex === -1) return null;
    const encoded = value.slice(0, dotIndex);
    const hmac = value.slice(dotIndex + 1);
    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(encoded)
      .digest('hex');
    const valid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expected, 'hex'),
    );
    if (!valid) return null;
    return JSON.parse(fromBase64url(encoded));
  } catch {
    return null;
  }
}
