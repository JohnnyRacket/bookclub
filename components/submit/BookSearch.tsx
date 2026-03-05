'use client';

import { useState, useEffect, useRef } from 'react';
import type { OLSearchResult } from '@/lib/openlibrary/client';

interface BookSearchProps {
  onSelect: (result: OLSearchResult) => void;
  selected: OLSearchResult | null;
  onClear: () => void;
}

export function BookSearch({ onSelect, selected, onClear }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OLSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ol-search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json() as OLSearchResult[];
        setResults(data);
        setError(null);
      } catch {
        setError('Search failed. Try again.');
      } finally {
        setLoading(false);
      }
    }, 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
        {selected.coverUrl ? (
          <img
            src={selected.coverUrl}
            alt={selected.title}
            className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
            style={{ background: 'color-mix(in oklch, var(--color-primary) 10%, white)' }}
          >
            📖
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
            {selected.title}
          </p>
          <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'var(--font-nunito)' }}>
            {selected.author}
            {selected.year && <span className="ml-2 opacity-70">· {selected.year}</span>}
          </p>
        </div>
        <button
          onClick={() => { onClear(); setQuery(''); setResults([]); }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        className="block text-sm font-semibold text-foreground mb-2"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        Search OpenLibrary
      </label>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Title, author, or ISBN…"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 transition-shadow"
        style={{ fontFamily: 'var(--font-nunito)', focusRingColor: 'var(--color-primary)' } as React.CSSProperties}
      />

      {loading && (
        <p className="mt-3 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          Searching…
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-amber-600" style={{ fontFamily: 'var(--font-nunito)' }}>
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map(r => (
            <button
              key={r.olKey || `${r.title}-${r.author}`}
              onClick={() => onSelect(r)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm text-left transition-all"
            >
              {r.coverUrl ? (
                <img
                  src={r.coverUrl}
                  alt={r.title}
                  className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
                  style={{ background: 'color-mix(in oklch, var(--color-primary) 10%, white)' }}
                >
                  📖
                </div>
              )}
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold text-foreground truncate"
                  style={{ fontFamily: 'var(--font-fredoka)' }}
                >
                  {r.title}
                </p>
                <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'var(--font-nunito)' }}>
                  {r.author}
                  {r.year && <span className="ml-2 opacity-70">· {r.year}</span>}
                  {r.pages && <span className="ml-2 opacity-70">· {r.pages}p</span>}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
