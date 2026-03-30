'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { starBook } from '@/lib/actions/books';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BookStarsProps {
  bookId: number;
  starAvg: number | null;
  starCount: number;
  userStar: number | null;
  upCount: number;
  downCount: number;
  locked: boolean;
}

function StarIcon({ fill, size = 16 }: { fill: 'full' | 'half' | 'empty'; size?: number }) {
  if (fill === 'full') {
    return (
      <Star
        size={size}
        className="text-amber-400"
        fill="currentColor"
        strokeWidth={1.5}
      />
    );
  }
  if (fill === 'half') {
    return (
      <span className="relative inline-flex" style={{ width: size, height: size }}>
        <Star size={size} className="text-gray-300" strokeWidth={1.5} />
        <span className="absolute inset-0" style={{ clipPath: 'inset(0 50% 0 0)' }}>
          <Star size={size} className="text-amber-400" fill="currentColor" strokeWidth={1.5} />
        </span>
      </span>
    );
  }
  return <Star size={size} className="text-gray-300" strokeWidth={1.5} />;
}

function StarDisplay({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        let fill: 'full' | 'half' | 'empty' = 'empty';
        if (value >= i) fill = 'full';
        else if (value >= i - 0.5) fill = 'half';
        return <StarIcon key={i} fill={fill} size={size} />;
      })}
    </span>
  );
}

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const displayValue = hover ?? value ?? 0;

  return (
    <div className="flex items-center justify-center gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className="relative inline-flex" style={{ width: 44, height: 44 }}>
          {/* Left half — half star */}
          <button
            type="button"
            disabled={disabled}
            className="absolute inset-0 w-1/2 z-10 cursor-pointer disabled:cursor-not-allowed"
            onMouseEnter={() => setHover(star - 0.5)}
            onClick={() => onChange(star - 0.5)}
            aria-label={`${star - 0.5} stars`}
          />
          {/* Right half — full star */}
          <button
            type="button"
            disabled={disabled}
            className="absolute inset-0 left-1/2 w-1/2 z-10 cursor-pointer disabled:cursor-not-allowed"
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star)}
            aria-label={`${star} stars`}
          />
          {/* Visual star */}
          <span className="flex items-center justify-center w-full h-full pointer-events-none">
            <StarIcon
              fill={displayValue >= star ? 'full' : displayValue >= star - 0.5 ? 'half' : 'empty'}
              size={32}
            />
          </span>
        </span>
      ))}
    </div>
  );
}

export function BookStars({ bookId, starAvg, starCount, userStar, upCount, downCount, locked }: BookStarsProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingStar, setPendingStar] = useState<number | null>(null);

  // If no star ratings exist, convert from thumbs
  const total = upCount + downCount;
  const displayAvg = starAvg ?? (total > 0 ? Math.round((upCount / total) * 5 * 10) / 10 : null);
  const displayCount = starCount > 0 ? starCount : (total > 0 ? total : 0);
  const isConverted = starAvg === null && total > 0;

  function handleRate(value: number) {
    setPendingStar(value);
    startTransition(async () => {
      await starBook(bookId, value);
      window.dispatchEvent(new CustomEvent('book-stats-changed'));
      setDialogOpen(false);
      setPendingStar(null);
    });
  }

  function handleClear() {
    if (userStar === null) return;
    // Re-submit same value to toggle off
    setPendingStar(null);
    startTransition(async () => {
      await starBook(bookId, userStar);
      window.dispatchEvent(new CustomEvent('book-stats-changed'));
      setDialogOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => !locked && setDialogOpen(true)}
        disabled={locked && displayAvg === null}
        className={`flex flex-col items-center gap-0.5 rounded-2xl px-3.5 py-2 w-full transition-all ${
          locked
            ? 'cursor-default'
            : 'cursor-pointer hover:bg-amber-50'
        } ${userStar !== null ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-gray-100'}`}
      >
        <StarDisplay value={displayAvg ?? 0} size={14} />
        {displayAvg !== null ? (
          <span
            className="text-[10px] font-semibold tabular-nums text-gray-600 leading-tight"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            {displayAvg.toFixed(1)}
            {displayCount > 0 && (
              <span className="text-gray-400 ml-0.5">({displayCount})</span>
            )}
          </span>
        ) : (
          <span
            className="text-[10px] text-gray-400 leading-tight"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            No ratings
          </span>
        )}
      </button>

      {!locked && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-full max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle
                className="text-center text-lg"
                style={{ fontFamily: 'var(--font-fredoka)' }}
              >
                Rate this book
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <StarRatingInput
                value={pendingStar ?? userStar}
                onChange={handleRate}
                disabled={isPending}
              />
              <p
                className="text-center text-sm text-muted-foreground mt-3"
                style={{ fontFamily: 'var(--font-nunito)' }}
              >
                {(pendingStar ?? userStar) !== null
                  ? `Your rating: ${(pendingStar ?? userStar)!.toFixed(1)} stars`
                  : 'Tap a star to rate'}
              </p>
            </div>

            {userStar !== null && (
              <div className="flex justify-center pb-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isPending}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  Remove my rating
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
