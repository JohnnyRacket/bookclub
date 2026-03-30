'use client';

import { BookRating } from './BookRating';
import { BookReacts } from './BookReacts';
import type { BookWithStats } from '@/lib/actions/books';
import type { CustomReaction } from '@/lib/actions/reactions';
import { useBookStats } from '@/hooks/useBookStats';
import { Sparkles } from 'lucide-react';

interface CurrentBookCardProps {
  book: BookWithStats | null;
  emojis: string[];
  thumbsUpEmoji: string;
  thumbsDownEmoji: string;
  customReactions?: CustomReaction[];
  ratingMode: 'thumbs' | 'stars';
}

export function CurrentBookCard({ book, emojis, thumbsUpEmoji, thumbsDownEmoji, customReactions, ratingMode }: CurrentBookCardProps) {
  const liveStats = useBookStats(book?.id ?? 0, {
    reacts: book?.reacts ?? [],
    up_count: book?.up_count ?? 0,
    down_count: book?.down_count ?? 0,
    user_thumb: book?.user_thumb ?? null,
    star_avg: book?.star_avg ?? null,
    star_count: book?.star_count ?? 0,
    user_star: book?.user_star ?? null,
  });

  if (!book) {
    return (
      <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-10 text-center h-full flex flex-col items-center justify-center">
        <svg width="56" height="68" viewBox="0 0 56 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 opacity-40">
          {/* Dashed book outline — conveys an empty slot */}
          {/* Main cover outline */}
          <rect x="4.75" y="2.75" width="46.5" height="60.5" rx="2.5"
            style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '4 3' }}
          />
          {/* Spine divider */}
          <line x1="12" y1="2.75" x2="12" y2="63.25"
            style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '4 3' }}
          />
          {/* Title line placeholders */}
          <line x1="20" y1="22" x2="43" y2="22"
            style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
          />
          <line x1="22" y1="28" x2="40" y2="28"
            style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
          />
          {/* Author line placeholder */}
          <line x1="24" y1="44" x2="38" y2="44"
            style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
          />
        </svg>
        <h2
          className="text-2xl font-semibold text-foreground mb-2"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          No current book
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs" style={{ fontFamily: 'var(--font-nunito)' }}>
          The group hasn&apos;t selected a book yet. Submit a suggestion or check back soon!
        </p>
      </div>
    );
  }

  const genres: string[] = book.genres ? JSON.parse(book.genres) : [];

  return (
    // Outer wrapper: relative so the picker can position absolutely off the card bottom
    <div className="relative">
      <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] overflow-hidden">
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
            <BookRating
              ratingMode={ratingMode}
              bookId={book.id}
              upCount={liveStats.up_count}
              downCount={liveStats.down_count}
              userThumb={liveStats.user_thumb}
              starAvg={liveStats.star_avg}
              starCount={liveStats.star_count}
              userStar={liveStats.user_star}
              locked={false}
              upEmoji={thumbsUpEmoji}
              downEmoji={thumbsDownEmoji}
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

            {book.theme && (
              <div className="mb-1.5">
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold"
                  style={{
                    color: 'var(--color-primary)',
                    fontFamily: 'var(--font-nunito)',
                  }}
                >
                  <Sparkles size={12} />
                  {book.theme}
                </span>
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
            reacts={liveStats.reacts}
            locked={false}
            emojis={emojis}
            customReactions={customReactions}
          />
        </div>
      </div>
    </div>
  );
}
