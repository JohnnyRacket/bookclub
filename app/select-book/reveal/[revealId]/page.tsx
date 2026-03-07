import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getRevealSession } from '@/lib/actions/reveal-session';
import { isAdmin } from '@/lib/actions/admin';
import { RevealRoom } from '@/components/selection/RevealRoom';

export default async function RevealPage({ params }: { params: Promise<{ revealId: string }> }) {
  const session = await getSession();
  if (!session) redirect('/join');

  const { revealId: revealIdStr } = await params;
  const revealId = parseInt(revealIdStr, 10);

  const [revealSession, adminCheck] = await Promise.all([
    getRevealSession(revealId),
    isAdmin(),
  ]);

  if (!revealSession) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
      >
        <div className="text-center">
          <p className="text-4xl mb-4">📭</p>
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Reveal session not found
          </h1>
          <a
            href="/"
            className="inline-block mt-4 px-6 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <RevealRoom initialSession={revealSession} isAdmin={adminCheck} />;
}
