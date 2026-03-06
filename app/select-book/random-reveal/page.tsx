import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getSelectionConfig } from '@/lib/actions/book-selection';

export default async function RandomRevealPage() {
  const session = await getSession();
  if (!session) redirect('/join');

  const config = await getSelectionConfig();
  if (config.selectionMode !== 'random') redirect('/');

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="text-center animate-page-in">
        <p className="text-6xl mb-4">🎡</p>
        <h1
          className="text-3xl font-semibold mb-2"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Coming Soon
        </h1>
        <p
          className="text-sm text-muted-foreground"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          The wheel is being built!
        </p>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
