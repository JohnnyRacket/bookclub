import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getClubConfig } from '@/lib/actions/settings';
import { getPastBooks } from '@/lib/actions/books';
import { PastBookCard } from '@/components/books/PastBookCard';

export default async function PastReadsPage() {
  const session = await getSession();
  if (!session) redirect('/join');

  const [pastBooks, clubConfig] = await Promise.all([
    getPastBooks(),
    getClubConfig(),
  ]);

  // Group by year derived from archived_at (Unix seconds)
  const byYear = new Map<number | 'Unknown', typeof pastBooks>();
  for (const book of pastBooks) {
    const year = book.archived_at
      ? new Date(book.archived_at * 1000).getFullYear()
      : 'Unknown';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(book);
  }

  // Sort years descending, Unknown at end
  const years = [...byYear.keys()].sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return (b as number) - (a as number);
  });

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="text-sm font-semibold"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            ← Back
          </a>
          <h1
            className="text-2xl font-semibold text-foreground mt-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Past Reads
          </h1>
        </div>

        {pastBooks.length === 0 ? (
          <div
            className="flex-shrink-0 w-36 rounded-2xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center text-center p-4 h-[248px]"
            style={{
              borderColor: 'color-mix(in oklch, var(--color-primary) 35%, transparent)',
              background: 'color-mix(in oklch, var(--color-primary) 6%, white)',
            }}
          >
            <svg width="36" height="44" viewBox="0 0 56 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2 opacity-40">
              <rect x="4.75" y="2.75" width="46.5" height="60.5" rx="2.5"
                style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '4 3' }}
              />
              <line x1="12" y1="2.75" x2="12" y2="63.25"
                style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '4 3' }}
              />
              <line x1="20" y1="22" x2="43" y2="22"
                style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
              />
              <line x1="22" y1="28" x2="40" y2="28"
                style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
              />
              <line x1="24" y1="44" x2="38" y2="44"
                style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
              />
            </svg>
            <p
              className="text-xs font-semibold leading-snug"
              style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, black)', fontFamily: 'var(--font-fredoka)' }}
            >
              Past reads will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-10 animate-page-in">
            {years.map(year => (
              <div key={String(year)}>
                {/* Year separator */}
                <div className="flex items-center gap-3 mb-4">
                  <h2
                    className="text-base font-semibold"
                    style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-fredoka)' }}
                  >
                    {year}
                  </h2>
                  <div
                    className="flex-1 h-px rounded-full"
                    style={{ background: 'color-mix(in oklch, var(--color-primary) 30%, transparent)' }}
                  />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
                  {byYear.get(year)!.map(book => (
                    <div key={book.id} className="flex justify-center">
                      <PastBookCard
                        book={book}
                        thumbsUpEmoji={clubConfig.thumbsUpEmoji}
                        thumbsDownEmoji={clubConfig.thumbsDownEmoji}
                        ratingMode={clubConfig.ratingMode}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-12" style={{ fontFamily: 'var(--font-nunito)' }}>
          🌿 {clubConfig.name}
        </p>
      </div>
    </div>
  );
}
