import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/auth/cookies';
import { buildBackupZip } from '@/lib/actions/backup';

const ADMIN_COOKIE = 'bc_admin';

async function checkAdmin(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const payload = (await verifyCookie(raw)) as Record<string, unknown> | null;
  return !!(payload && payload.type === 'admin');
}

export async function GET() {
  if (!(await checkAdmin())) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const { buffer, filename } = await buildBackupZip();
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
      },
    });
  } catch (err) {
    console.error('Backup export failed:', err);
    return new Response('Export failed', { status: 500 });
  }
}
