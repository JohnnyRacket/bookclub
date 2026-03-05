'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BookThumbs } from './BookThumbs';
import { BookReacts } from './BookReacts';
import type { BookWithStats } from '@/lib/actions/books';

interface PastBookModalProps {
  book: BookWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PastBookModal({ book, open, onOpenChange }: PastBookModalProps) {
  const genres: string[] = book.genres ? JSON.parse(book.genres) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg rounded-3xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-20 h-28 object-cover rounded-xl shadow-md"
                />
              ) : (
                <div
                  className="w-20 h-28 rounded-xl flex items-center justify-center text-3xl"
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
                locked={true}
              />
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
              >
                Past Read
              </p>
              <h2
                className="text-xl font-semibold text-foreground leading-tight mb-0.5"
                style={{ fontFamily: 'var(--font-fredoka)' }}
              >
                {book.title}
              </h2>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
                by {book.author}
                {book.year && <span className="ml-2 opacity-60">· {book.year}</span>}
                {book.pages && <span className="ml-2 opacity-60">· {book.pages}p</span>}
              </p>
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {genres.slice(0, 3).map(g => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600"
                      style={{ fontFamily: 'var(--font-nunito)' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-2.5 border-t border-gray-50">
          <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-nunito)' }}>
            Reactions are locked for past books
          </p>
          <BookReacts
            bookId={book.id}
            reacts={book.reacts}
            locked={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
