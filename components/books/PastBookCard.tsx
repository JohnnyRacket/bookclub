'use client';

import { useState } from 'react';
import { PastBookModal } from './PastBookModal';
import type { BookWithStats } from '@/lib/actions/books';

interface PastBookCardProps {
  book: BookWithStats;
  thumbsUpEmoji: string;
  thumbsDownEmoji: string;
}

export function PastBookCard({ book, thumbsUpEmoji, thumbsDownEmoji }: PastBookCardProps) {
  const [open, setOpen] = useState(false);

  const totalThumbs = book.up_count + book.down_count;
  const score = totalThumbs === 0 ? null : `${Math.round((book.up_count / totalThumbs) * 100)}%`;
  const topReacts = book.reacts.filter(r => r.count > 0).slice(0, 3);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col flex-shrink-0 w-36 bg-white rounded-2xl shadow-[var(--shadow-card-sm)] overflow-hidden text-left hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5 transition-all cursor-pointer"
      >
        {/* Cover */}
        <div className="relative w-full h-44 bg-gray-100">
          {book.cover_url ? (
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${book.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'top center',
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-3xl"
              style={{ background: 'color-mix(in oklch, var(--color-primary) 30%, white)' }}
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
            {score !== null && (
              <span
                className="text-[11px] font-semibold tabular-nums bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5"
                style={{ fontFamily: 'var(--font-nunito)' }}
              >
                {score}
              </span>
            )}
            {topReacts.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs">
                {topReacts.map(r =>
                  r.emoji.startsWith('/') ? (
                    <img key={r.emoji} src={r.emoji} alt="reaction" className="w-4 h-4 object-contain" />
                  ) : (
                    <span key={r.emoji}>{r.emoji}</span>
                  )
                )}
              </span>
            )}
          </div>
        </div>
      </button>

      <PastBookModal
        book={book}
        open={open}
        onOpenChange={setOpen}
        thumbsUpEmoji={thumbsUpEmoji}
        thumbsDownEmoji={thumbsDownEmoji}
      />
    </>
  );
}
