import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/auth/cookies';
import { restoreFromZip } from '@/lib/actions/backup';

const ADMIN_COOKIE = 'bc_admin';

async function checkAdmin(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const payload = (await verifyCookie(raw)) as Record<string, unknown> | null;
  return !!(payload && payload.type === 'admin');
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return new Response('Unauthorized', { status: 401 });
  }
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Could not parse form data' }, { status: 400 });
  }
  const file = formData.get('backup') as File | null;
  if (!file || file.size === 0) {
    return Response.json({ error: 'No backup file provided' }, { status: 400 });
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await restoreFromZip(buffer);
    return Response.json({ success: true, ...result });
  } catch (err) {
    console.error('Backup import failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: `Import failed: ${message}` }, { status: 500 });
  }
}
