'use client';

import { useTransition } from 'react';
import { thumbBook } from '@/lib/actions/books';

interface BookThumbsProps {
  bookId: number;
  upCount: number;
  downCount: number;
  userThumb: 1 | -1 | null;
  locked: boolean;
}

export function BookThumbs({ bookId, upCount, downCount, userThumb, locked }: BookThumbsProps) {
  const [isPending, startTransition] = useTransition();

  function handleThumb(value: 1 | -1) {
    if (locked) return;
    startTransition(async () => {
      await thumbBook(bookId, value);
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleThumb(1)}
        disabled={isPending || locked}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all
          ${userThumb === 1
            ? 'bg-green-100 text-green-700 ring-1 ring-green-300 scale-[1.04]'
            : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        👍 <span>{upCount}</span>
      </button>
      <button
        onClick={() => handleThumb(-1)}
        disabled={isPending || locked}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all
          ${userThumb === -1
            ? 'bg-red-100 text-red-700 ring-1 ring-red-300 scale-[1.04]'
            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        👎 <span>{downCount}</span>
      </button>
    </div>
  );
}
