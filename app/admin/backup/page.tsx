import { requireAdmin } from '@/lib/actions/admin';
import { AuthShell } from '@/components/auth/AuthShell';
import { BackupPanel } from '@/components/backup/BackupPanel';
import Link from 'next/link';

export default async function BackupPage() {
  await requireAdmin();

  return (
    <AuthShell>
      <div className="w-full max-w-md animate-page-in">
        <div className="mb-6 stagger">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            ← Admin
          </Link>
          <div className="text-center">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
            >
              Admin
            </p>
            <h1
              className="text-3xl font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-fredoka)' }}
            >
              Backup & Restore
            </h1>
            <p
              className="mt-1 text-sm text-muted-foreground"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Export your club data as a ZIP, or restore from a previous backup.
            </p>
          </div>
        </div>

        <BackupPanel />
      </div>
    </AuthShell>
  );
}
