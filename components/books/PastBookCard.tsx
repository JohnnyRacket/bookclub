'use client';

import { useState } from 'react';
import { PastBookModal } from './PastBookModal';
import type { BookWithStats } from '@/lib/actions/books';

interface PastBookCardProps {
  book: BookWithStats;
}

export function PastBookCard({ book }: PastBookCardProps) {
  const [open, setOpen] = useState(false);

  const totalThumbs = book.up_count + book.down_count;
  const topReacts = book.reacts.filter(r => r.count > 0).slice(0, 3);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden text-left hover:shadow-[0_8px_32px_rgba(0,0,0,0.13)] hover:-translate-y-0.5 transition-all"
      >
        {/* Cover */}
        <div className="relative h-44 bg-gray-100">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-3xl"
              style={{ background: 'color-mix(in oklch, var(--color-primary) 12%, white)' }}
            >
              📖
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p
            className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-0.5"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            {book.title}
          </p>
          <p className="text-[11px] text-muted-foreground truncate mb-1.5" style={{ fontFamily: 'var(--font-nunito)' }}>
            {book.author}
          </p>
          <div className="flex items-center gap-1.5">
            {totalThumbs > 0 && (
              <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
                {book.up_count > 0 && `👍${book.up_count}`}
                {book.up_count > 0 && book.down_count > 0 && ' '}
                {book.down_count > 0 && `👎${book.down_count}`}
              </span>
            )}
            {topReacts.length > 0 && (
              <span className="text-xs">
                {topReacts.map(r => r.emoji).join('')}
              </span>
            )}
          </div>
        </div>
      </button>

      <PastBookModal book={book} open={open} onOpenChange={setOpen} />
    </>
  );
}
