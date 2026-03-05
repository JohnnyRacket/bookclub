import { requireAdmin } from '@/lib/actions/admin';
import { AuthShell } from '@/components/auth/AuthShell';
import { BackfillBookForm } from '@/components/books/BackfillBookForm';
import Link from 'next/link';

export default async function BackfillPage() {
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
              Backfill Past Read
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
              Add a book directly to the archive with a custom read date.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] px-5 py-6 stagger">
          <BackfillBookForm />
        </div>
      </div>
    </AuthShell>
  );
}
