'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type VoteStatus = { sessionId: number; status: string } | null;
type RevealStatus = { revealId: number; status: string } | null;

function AlertBanner({
  dot,
  title,
  subtitle,
  href,
  label,
}: {
  dot?: string;
  title: string;
  subtitle: string;
  href: string;
  label: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 mb-4"
      style={{
        background: 'color-mix(in oklch, var(--color-primary) 12%, white)',
        border: '2px solid color-mix(in oklch, var(--color-primary) 35%, transparent)',
        boxShadow: '0 2px 8px color-mix(in oklch, var(--color-primary) 15%, transparent)',
      }}
    >
      <span className="relative flex-shrink-0 flex items-center justify-center h-3 w-3">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ background: dot ?? 'oklch(0.65 0.2 145)' }}
        />
        <span
          className="relative inline-flex rounded-full h-3 w-3"
          style={{ background: dot ?? 'oklch(0.65 0.2 145)' }}
        />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold leading-tight"
          style={{ color: 'color-mix(in oklch, var(--color-primary) 85%, black)', fontFamily: 'var(--font-fredoka)' }}
        >
          {title}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, black)', fontFamily: 'var(--font-nunito)' }}
        >
          {subtitle}
        </p>
      </div>
      <Link
        href={href}
        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{
          background: 'var(--color-primary)',
          color: 'white',
          fontFamily: 'var(--font-nunito)',
          boxShadow: '0 6px 20px color-mix(in oklch, var(--color-primary) 40%, transparent)',
        }}
      >
        {label}
      </Link>
    </div>
  );
}

export function VoteAlert({
  initialVote,
  initialReveal,
}: {
  initialVote: VoteStatus;
  initialReveal: RevealStatus;
}) {
  const [voteStatus, setVoteStatus] = useState<VoteStatus>(initialVote);
  const [revealStatus, setRevealStatus] = useState<RevealStatus>(initialReveal);

  useEffect(() => {
    const es = new EventSource('/api/vote-status');

    es.addEventListener('status', (e) => {
      try { setVoteStatus(JSON.parse(e.data)); } catch { /* ignore */ }
    });

    es.addEventListener('reveal-status', (e) => {
      try { setRevealStatus(JSON.parse(e.data)); } catch { /* ignore */ }
    });

    return () => es.close();
  }, []);

  return (
    <>
      {revealStatus && (
        <AlertBanner
          dot="oklch(0.65 0.2 145)"
          title="A book reveal is starting!"
          subtitle="Join the lobby — the selection show is about to begin."
          href={`/select-book/reveal/${revealStatus.revealId}`}
          label="Join the fun"
        />
      )}
      {voteStatus && (
        <AlertBanner
          title="Vote in progress!"
          subtitle="The club is picking the next book."
          href={`/select-book/vote/${voteStatus.sessionId}`}
          label="Join"
        />
      )}
    </>
  );
}
