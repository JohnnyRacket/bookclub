/**
 * Edge-compatible HMAC verify using Web Crypto API.
 * No Node.js imports — safe for middleware / Edge runtime.
 */

export async function verifyCookieEdge(
  value: string,
  secret: string,
): Promise<object | null> {
  try {
    const dotIndex = value.lastIndexOf('.');
    if (dotIndex === -1) return null;
    const encoded = value.slice(0, dotIndex);
    const hmacHex = value.slice(dotIndex + 1);

    const keyData = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const hmacBytes = new Uint8Array(
      hmacHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
    );
    const msgBytes = new TextEncoder().encode(encoded);
    const valid = await crypto.subtle.verify('HMAC', key, hmacBytes, msgBytes);
    if (!valid) return null;

    // base64url decode without Node Buffer
    const padding = '='.repeat((4 - (encoded.length % 4)) % 4);
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/') + padding;
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
