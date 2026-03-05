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
        background: 'color-mix(in oklch, var(--color-primary) 12%, white)',
      }}
    >
      <div className="text-center max-w-xs animate-page-in stagger">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          {clubConfig.name}
        </p>

        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8">
          <div
            className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm"
            style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-fredoka)' }}
          >
            {session.name.charAt(0).toUpperCase()}
          </div>
          <h1
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Hello, {session.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
            More features coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
