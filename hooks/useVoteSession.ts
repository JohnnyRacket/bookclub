'use client';

import { useState, useEffect } from 'react';
import type { SessionSnapshot } from '@/lib/actions/book-selection';

export function useVoteSession(
  sessionId: number,
  initial: SessionSnapshot,
): { snapshot: SessionSnapshot; viewers: string[] } {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(initial);
  const [viewers, setViewers] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    const es = new EventSource(`/api/vote-session?sessionId=${sessionId}`);

    es.addEventListener('snapshot', (e) => {
      try { setSnapshot(JSON.parse(e.data)); } catch { /* ignore */ }
    });

    es.addEventListener('presence', (e) => {
      try { setViewers(JSON.parse(e.data)); } catch { /* ignore */ }
    });

    const refresh = async () => {
      try {
        const res = await fetch(`/api/vote-session?sessionId=${sessionId}&snapshot=1`);
        if (res.ok) setSnapshot(await res.json());
      } catch { /* ignore */ }
    };
    window.addEventListener('vote-session-changed', refresh);

    return () => {
      es.close();
      window.removeEventListener('vote-session-changed', refresh);
    };
  }, [sessionId]);

  return { snapshot, viewers };
}
