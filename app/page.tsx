import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { clubConfig } from '@/lib/config';

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/join');

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.93 0.025 75 / 0.5) 0%, transparent 70%),
          oklch(0.975 0.012 75)
        `,
      }}
    >
      <div className="text-center max-w-sm animate-page-in stagger">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
          <span
            className="text-xs tracking-[0.25em] uppercase"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-geist-sans)' }}
          >
            {clubConfig.name}
          </span>
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
        </div>
        <h1
          className="text-5xl font-light text-foreground/90 mb-4"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Hello, {session.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          More features coming soon.
        </p>
        <p className="mt-12 text-xs text-muted-foreground/40 tracking-widest">✦</p>
      </div>
    </div>
  );
}
