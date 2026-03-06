import { requireAdmin } from '@/lib/actions/admin';
import { AuthShell } from '@/components/auth/AuthShell';
import { OverrideBookForm } from '@/components/books/OverrideBookForm';
import Link from 'next/link';

export default async function OverridePage() {
  await requireAdmin();

  return (
    <AuthShell>
      <div className="w-full max-w-md animate-page-in">
        {/* Header */}
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
              Override Current Book
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
              Force-set any book as current, bypassing voting and submissions.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] px-5 py-6 stagger">
          <OverrideBookForm />
        </div>
      </div>
    </AuthShell>
  );
}
