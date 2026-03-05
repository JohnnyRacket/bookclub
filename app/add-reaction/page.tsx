import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AddReactionForm } from '@/components/reactions/AddReactionForm';
import Link from 'next/link';

export default async function AddReactionPage() {
  const session = await getSession();
  if (!session) redirect('/join');

  return (
    <div
      className="min-h-screen px-4 py-8 flex flex-col items-center"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-semibold"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            ← Back
          </Link>
        </div>

        <div className="acnh-card p-6">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Add Custom Reaction
          </h1>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-nunito)' }}>
            Upload an image to use as a reaction. Everyone in the club can use it.
          </p>

          <AddReactionForm />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8" style={{ fontFamily: 'var(--font-nunito)' }}>
          🌿 Custom reactions are shared with the whole club
        </p>
      </div>
    </div>
  );
}
