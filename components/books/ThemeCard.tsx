import Link from 'next/link';

export function ThemeCard({ theme, atSubmissionCap }: { theme: string | null; atSubmissionCap?: boolean }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'color-mix(in oklch, var(--color-primary) 14%, white)',
        border: '1.5px solid color-mix(in oklch, var(--color-primary) 22%, white)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          Next Book's Theme
        </p>
        <Link
          href="/theme"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Edit
        </Link>
      </div>

      {theme ? (
        <>
          <p
            className="text-lg font-semibold text-foreground leading-snug"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            {theme}
          </p>
          <Link
            href={atSubmissionCap ? '/my-submissions' : '/submit'}
            className="mt-2 inline-block text-xs font-semibold underline underline-offset-2 hover:no-underline"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            {atSubmissionCap ? 'View my submissions' : 'Submit a book'}
          </Link>
        </>
      ) : (
        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          No theme set yet.{' '}
          <Link
            href="/theme"
            className="font-semibold underline underline-offset-2 hover:no-underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Set one
          </Link>
        </p>
      )}
    </div>
  );
}
