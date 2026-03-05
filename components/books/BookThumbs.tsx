'use client';

import { useTransition } from 'react';
import { thumbBook } from '@/lib/actions/books';

interface BookThumbsProps {
  bookId: number;
  upCount: number;
  downCount: number;
  userThumb: 1 | -1 | null;
  locked: boolean;
  upEmoji?: string;
  downEmoji?: string;
}

export function BookThumbs({ bookId, upCount, downCount, userThumb, locked, upEmoji = '👍', downEmoji = '👎' }: BookThumbsProps) {
  const [isPending, startTransition] = useTransition();

  function handleThumb(value: 1 | -1) {
    if (locked) return;
    startTransition(async () => {
      await thumbBook(bookId, value);
      window.dispatchEvent(new CustomEvent('book-stats-changed'));
    });
  }

  const total = upCount + downCount;
  const score = total === 0 ? '—' : `${Math.round((upCount / total) * 100)}%`;

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => handleThumb(1)}
        disabled={isPending || locked}
        className={`w-9 h-9 flex items-center justify-center rounded-full text-base transition-all
          ${userThumb === 1
            ? 'bg-green-100 text-green-700 ring-1 ring-green-300 scale-[1.04]'
            : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
      >
        {upEmoji}
      </button>
      <button
        onClick={() => handleThumb(-1)}
        disabled={isPending || locked}
        className={`w-9 h-9 flex items-center justify-center rounded-full text-base transition-all
          ${userThumb === -1
            ? 'bg-red-100 text-red-700 ring-1 ring-red-300 scale-[1.04]'
            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
          } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
      >
        {downEmoji}
      </button>
      <span
        className="w-9 h-9 flex items-center justify-center rounded-full text-xs font-semibold bg-gray-100 text-gray-500 tabular-nums"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        {score}
      </span>
    </div>
  );
}
