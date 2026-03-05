'use client';

import { useState, useEffect } from 'react';
import type { BookReact } from '@/lib/actions/books';

export type BookStatsSnapshot = {
  reacts: BookReact[];
  up_count: number;
  down_count: number;
  user_thumb: 1 | -1 | null;
};

export function useBookStats(bookId: number, initial: BookStatsSnapshot): BookStatsSnapshot {
  const [stats, setStats] = useState<BookStatsSnapshot>(initial);

  useEffect(() => {
    if (!bookId) return;
    const es = new EventSource(`/api/book-stats?bookId=${bookId}`);
    es.onmessage = (e) => {
      try {
        setStats(JSON.parse(e.data));
      } catch { /* ignore malformed events */ }
    };

    const refresh = async () => {
      try {
        const res = await fetch(`/api/book-stats?bookId=${bookId}&snapshot=1`);
        if (res.ok) setStats(await res.json());
      } catch { /* ignore */ }
    };
    window.addEventListener('book-stats-changed', refresh);

    return () => {
      es.close();
      window.removeEventListener('book-stats-changed', refresh);
    };
  }, [bookId]);

  return stats;
}
