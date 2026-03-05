import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getNextBookTheme, updateNextBookTheme } from '@/lib/actions/settings';
import { ThemeForm } from '@/components/books/ThemeForm';

export default async function ThemePage() {
  const session = await getSession();
  if (!session) redirect('/join');

  const theme = await getNextBookTheme();

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            ← Back
          </Link>
          <h1
            className="text-3xl font-semibold text-foreground mt-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Next Book's Theme
          </h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
            Any member can set the theme for the next book.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-6 animate-page-in">
          <ThemeForm
            action={updateNextBookTheme}
            defaultTheme={theme ?? ''}
          />
        </div>
      </div>
    </div>
  );
}
