'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function ActionMenu({ atSubmissionCap }: { atSubmissionCap: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          + Do Something
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 p-1.5 rounded-xl border-0"
        style={{ background: 'var(--color-primary)' }}
      >
        <button
          onClick={() => !atSubmissionCap && go('/submit')}
          disabled={atSubmissionCap}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {atSubmissionCap ? 'Book(s) Submitted' : 'Submit Book'}
        </button>
        <button
          onClick={() => go('/meeting')}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Select Next Book
        </button>
        <div className="my-1 border-t border-white/30" />
        <button
          onClick={() => go('/admin')}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Elevate to Admin
        </button>
      </PopoverContent>
    </Popover>
  );
}
