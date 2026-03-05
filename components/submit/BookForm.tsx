'use client';

import { useState } from 'react';
import { submitBook } from '@/lib/actions/submit';
import type { OLSearchResult } from '@/lib/openlibrary/client';

interface BookFormProps {
  prefill: OLSearchResult | null;
  onSuccess: () => void;
}

export function BookForm({ prefill, onSuccess }: BookFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await submitBook(formData);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
  }

  const genres = prefill?.genres?.join(', ') ?? '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="ol_key" defaultValue={prefill?.olKey ?? ''} />
      <input type="hidden" name="cover_url" defaultValue={prefill?.coverUrl ?? ''} />

      {prefill?.coverUrl && (
        <div className="flex justify-center">
          <img
            src={prefill.coverUrl}
            alt={prefill.title}
            className="w-24 h-34 object-cover rounded-xl shadow-md"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-nunito)' }}>
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          defaultValue={prefill?.title ?? ''}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
          style={{ fontFamily: 'var(--font-nunito)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-nunito)' }}>
          Author <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="author"
          required
          defaultValue={prefill?.author ?? ''}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
          style={{ fontFamily: 'var(--font-nunito)' }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-nunito)' }}>
            Year
          </label>
          <input
            type="number"
            name="year"
            defaultValue={prefill?.year ?? ''}
            min={1000}
            max={2100}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
            style={{ fontFamily: 'var(--font-nunito)' }}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-nunito)' }}>
            Pages
          </label>
          <input
            type="number"
            name="pages"
            defaultValue={prefill?.pages ?? ''}
            min={1}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
            style={{ fontFamily: 'var(--font-nunito)' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-nunito)' }}>
          Genres
          <span className="ml-1 text-xs font-normal text-muted-foreground">(comma-separated)</span>
        </label>
        <input
          type="text"
          name="genres"
          defaultValue={genres}
          placeholder="Fiction, Historical, Mystery…"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
          style={{ fontFamily: 'var(--font-nunito)' }}
        />
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700" style={{ fontFamily: 'var(--font-nunito)' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
      >
        {submitting ? 'Submitting…' : 'Submit Book'}
      </button>
    </form>
  );
}
