'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type VoteStatus = { sessionId: number; status: string } | null;

export function VoteAlert({ initial }: { initial: VoteStatus }) {
  const [voteStatus, setVoteStatus] = useState<VoteStatus>(initial);

  useEffect(() => {
    const es = new EventSource('/api/vote-status');

    es.addEventListener('status', (e) => {
      try {
        setVoteStatus(JSON.parse(e.data));
      } catch { /* ignore */ }
    });

    es.onerror = () => {
      // SSE will auto-reconnect; no action needed
    };

    return () => es.close();
  }, []);

  if (!voteStatus) return null;

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 mb-4"
      style={{
        background: 'color-mix(in oklch, var(--color-primary) 12%, white)',
        border: '2px solid color-mix(in oklch, var(--color-primary) 35%, transparent)',
        boxShadow: '0 2px 8px color-mix(in oklch, var(--color-primary) 15%, transparent)',
      }}
    >
      {/* Pulsing dot */}
      <span className="relative flex-shrink-0 flex items-center justify-center h-3 w-3">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ background: 'oklch(0.65 0.2 145)' }}
        />
        <span
          className="relative inline-flex rounded-full h-3 w-3"
          style={{ background: 'oklch(0.65 0.2 145)' }}
        />
      </span>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold leading-tight"
          style={{ color: 'color-mix(in oklch, var(--color-primary) 85%, black)', fontFamily: 'var(--font-fredoka)' }}
        >
          Vote in progress!
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, black)', fontFamily: 'var(--font-nunito)' }}
        >
          The club is picking the next book.
        </p>
      </div>

      <Link
        href={`/select-book/vote/${voteStatus.sessionId}`}
        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{
          background: 'var(--color-primary)',
          color: 'white',
          fontFamily: 'var(--font-nunito)',
          boxShadow: '0 6px 20px color-mix(in oklch, var(--color-primary) 40%, transparent)',
        }}
      >
        Join
      </Link>
    </div>
  );
}
