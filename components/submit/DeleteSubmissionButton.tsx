'use client';

import { useTransition } from 'react';
import { deleteMySubmission } from '@/lib/actions/submit';

export function DeleteSubmissionButton({ bookId }: { bookId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => { await deleteMySubmission(bookId); })}
      className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
      style={{ fontFamily: 'var(--font-nunito)' }}
    >
      {isPending ? '…' : 'Delete'}
    </button>
  );
}
