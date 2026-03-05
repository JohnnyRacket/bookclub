'use client';

import { BookThumbs } from './BookThumbs';
import { BookReacts } from './BookReacts';
import type { BookWithStats } from '@/lib/actions/books';

interface CurrentBookCardProps {
  book: BookWithStats | null;
  reactPresets: string[];
}

export function CurrentBookCard({ book, reactPresets }: CurrentBookCardProps) {

  if (!book) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-10 text-center h-full flex flex-col items-center justify-center">
        <div className="text-5xl mb-4">📚</div>
        <h2
          className="text-2xl font-semibold text-foreground mb-2"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          No current book
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs" style={{ fontFamily: 'var(--font-nunito)' }}>
          The admin hasn&apos;t selected a book yet. Submit a suggestion or check back soon!
        </p>
      </div>
    );
  }

  const genres: string[] = book.genres ? JSON.parse(book.genres) : [];

  return (
    // Outer wrapper: relative so the picker can position absolutely off the card bottom
    <div className="relative">
      <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex gap-5 p-6 pb-4">
          {/* Cover + thumbs stacked */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-28 h-40 sm:w-32 sm:h-48 object-cover rounded-2xl shadow-md"
              />
            ) : (
              <div
                className="w-28 h-40 sm:w-32 sm:h-48 rounded-2xl flex items-center justify-center text-4xl"
                style={{ background: 'color-mix(in oklch, var(--color-primary) 12%, white)' }}
              >
                📖
              </div>
            )}
            <BookThumbs
              bookId={book.id}
              upCount={book.up_count}
              downCount={book.down_count}
              userThumb={book.user_thumb}
              locked={false}
            />
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-1.5"
              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
            >
              Currently Reading
            </p>
            <h2
              className="text-2xl font-semibold text-foreground leading-tight mb-1"
              style={{ fontFamily: 'var(--font-fredoka)' }}
            >
              {book.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-nunito)' }}>
              by {book.author}
              {book.year && <span className="ml-2 opacity-60">· {book.year}</span>}
              {book.pages && <span className="ml-2 opacity-60">· {book.pages}p</span>}
            </p>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {genres.slice(0, 4).map(g => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600"
                    style={{ fontFamily: 'var(--font-nunito)' }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {book.submitter_name && (
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
                Suggested by {book.submitter_name}
              </p>
            )}
          </div>
        </div>

        {/* Bottom: full-width emoji row */}
        <div className="px-6 pb-6 pt-3 border-t border-gray-50">
          <BookReacts
            bookId={book.id}
            reacts={book.reacts}
            locked={false}
            reactPresets={reactPresets}
          />
        </div>
      </div>
    </div>
  );
}
