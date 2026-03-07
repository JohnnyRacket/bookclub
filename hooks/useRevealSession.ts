'use client';

import { useState, useEffect } from 'react';
import type { RevealSession, RevealBook } from '@/lib/actions/reveal-session';
import type { RevealStartPayload } from '@/lib/events/reveal-session-emitter';

export type { RevealBook };

export function useRevealSession(
  revealId: number,
  initial: RevealSession,
): {
  session: RevealSession;
  viewers: string[];
  startPayload: RevealStartPayload | null;
} {
  const [session, setSession] = useState<RevealSession>(initial);
  const [viewers, setViewers] = useState<string[]>([]);
  const [startPayload, setStartPayload] = useState<RevealStartPayload | null>(null);

  useEffect(() => {
    if (!revealId) return;
    const es = new EventSource(`/api/reveal-session?revealId=${revealId}`);

    es.addEventListener('lobby', (e) => {
      try {
        const data = JSON.parse(e.data);
        setSession(data);
        if (data.viewers) setViewers(data.viewers);
        // If session was reset to lobby (redo), clear the local start payload
        if (data.status === 'lobby') setStartPayload(null);
      } catch { /* ignore */ }
    });

    es.addEventListener('presence', (e) => {
      try { setViewers(JSON.parse(e.data)); } catch { /* ignore */ }
    });

    es.addEventListener('start', (e) => {
      try { setStartPayload(JSON.parse(e.data)); } catch { /* ignore */ }
    });

    return () => es.close();
  }, [revealId]);

  return { session, viewers, startPayload };
}
