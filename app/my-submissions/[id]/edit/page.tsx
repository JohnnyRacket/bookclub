import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getMySubmissionById } from '@/lib/actions/submit';
import { BookForm } from '@/components/submit/BookForm';

export default async function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/join');

  const { id } = await params;
  const bookId = Number(id);
  if (isNaN(bookId)) redirect('/my-submissions');

  const book = await getMySubmissionById(bookId);
  if (!book) redirect('/my-submissions');

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link
            href="/my-submissions"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            ← My Submissions
          </Link>
          <h1
            className="text-3xl font-semibold text-foreground mt-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Edit Submission
          </h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
            Update the details for your suggestion.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-6 animate-page-in">
          <BookForm
            prefill={null}
            editBookId={book.id}
            initialValues={{
              title: book.title,
              author: book.author,
              year: book.year,
              pages: book.pages,
              genres: book.genres,
              cover_url: book.cover_url,
              ol_key: book.ol_key,
            }}
          />
        </div>
      </div>
    </div>
  );
}
