import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/auth/session';
import { getMySubmissions } from '@/lib/actions/submit';
import { getClubConfig } from '@/lib/actions/settings';
import { DeleteSubmissionButton } from '@/components/submit/DeleteSubmissionButton';

export default async function MySubmissionsPage() {
  const session = await getSession();
  if (!session) redirect('/join');

  const [submissions, clubConfig] = await Promise.all([
    getMySubmissions(),
    getClubConfig(),
  ]);

  const canSubmitMore = submissions.length < clubConfig.maxSubmissionsPerMember;

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-lg mx-auto">
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
            My Submissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
            {submissions.length === 0
              ? 'You have no pending submissions.'
              : `${submissions.length} pending suggestion${submissions.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="space-y-3 animate-page-in">
          {canSubmitMore && submissions.length > 0 && (
            <Link
              href="/submit"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed text-sm font-semibold transition-colors"
              style={{
                borderColor: 'color-mix(in oklch, var(--color-primary) 40%, transparent)',
                color: 'color-mix(in oklch, var(--color-primary) 80%, black)',
                fontFamily: 'var(--font-nunito)',
              }}
            >
              + Submit Another Book
            </Link>
          )}

          {submissions.map(book => (
            <div
              key={book.id}
              className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-4 flex gap-4 items-center"
            >
              {/* Cover thumbnail */}
              <div className="flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={book.title}
                    width={56}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <svg width="24" height="30" viewBox="0 0 56 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
                    <rect x="4.75" y="2.75" width="46.5" height="60.5" rx="2.5"
                      style={{ stroke: 'var(--color-primary)', strokeWidth: '2' }}
                    />
                    <line x1="12" y1="2.75" x2="12" y2="63.25"
                      style={{ stroke: 'var(--color-primary)', strokeWidth: '2' }}
                    />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm text-foreground truncate"
                  style={{ fontFamily: 'var(--font-fredoka)' }}
                >
                  {book.title}
                </p>
                <p
                  className="text-xs text-muted-foreground truncate mt-0.5"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  {book.author}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, black)', fontFamily: 'var(--font-nunito)' }}
                >
                  Submitted {new Date(book.created_at * 1000).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <Link
                  href={`/my-submissions/${book.id}/edit`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white text-center transition-all hover:opacity-90"
                  style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
                >
                  Edit
                </Link>
                <DeleteSubmissionButton bookId={book.id} />
              </div>
            </div>
          ))}

          {submissions.length === 0 && (
            <Link
              href="/submit"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
            >
              Submit a Book
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
