'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { submitBook, updateMySubmission } from '@/lib/actions/submit';
import type { OLSearchResult } from '@/lib/openlibrary/client';

interface BookFormProps {
  prefill: OLSearchResult | null;
  onSuccess?: (canSubmitMore: boolean) => void;
  editBookId?: number;
  initialValues?: {
    title: string;
    author: string;
    year: number | null;
    pages: number | null;
    genres: string | null; // JSON array string e.g. '["Fiction"]'
    cover_url: string | null;
    ol_key: string | null;
  };
}

export function BookForm({ prefill, onSuccess, editBookId, initialValues }: BookFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const router = useRouter();

  const isEditMode = editBookId !== undefined;

  // Parse genres JSON string to comma-separated for display
  const initialGenres = (() => {
    if (isEditMode && initialValues?.genres) {
      try {
        const parsed = JSON.parse(initialValues.genres);
        return Array.isArray(parsed) ? parsed.join(', ') : '';
      } catch {
        return '';
      }
    }
    return prefill?.genres?.join(', ') ?? '';
  })();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (isEditMode) {
      const result = await updateMySubmission(editBookId, formData);
      setSubmitting(false);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/my-submissions');
      }
    } else {
      const result = await submitBook(formData);
      setSubmitting(false);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess?.(result.canSubmitMore ?? true);
      }
    }
  }

  const displayCover = coverPreview ?? (isEditMode ? initialValues?.cover_url : prefill?.coverUrl) ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="ol_key" defaultValue={isEditMode ? (initialValues?.ol_key ?? '') : (prefill?.olKey ?? '')} />
      <input type="hidden" name="cover_url" defaultValue={isEditMode ? '' : (prefill?.coverUrl ?? '')} />
      {isEditMode && (
        <input type="hidden" name="existing_cover_url" defaultValue={initialValues?.cover_url ?? ''} />
      )}

      {displayCover && (
        <div className="flex justify-center">
          <img
            src={displayCover}
            alt={isEditMode ? (initialValues?.title ?? 'Cover') : (prefill?.title ?? 'Cover preview')}
            className="w-24 h-34 object-cover rounded-xl shadow-md"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-nunito)' }}>
          Cover Image
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional upload)</span>
        </label>
        <input
          type="file"
          name="cover_file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0]
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
            const url = file ? URL.createObjectURL(file) : null
            previewUrlRef.current = url
            setCoverPreview(url)
          }}
          className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-nunito)' }}>
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          defaultValue={isEditMode ? (initialValues?.title ?? '') : (prefill?.title ?? '')}
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
          defaultValue={isEditMode ? (initialValues?.author ?? '') : (prefill?.author ?? '')}
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
            defaultValue={isEditMode ? (initialValues?.year ?? '') : (prefill?.year ?? '')}
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
            defaultValue={isEditMode ? (initialValues?.pages ?? '') : (prefill?.pages ?? '')}
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
          defaultValue={initialGenres}
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

      <div className="flex gap-2">
        {isEditMode && (
          <button
            type="button"
            onClick={() => router.push('/my-submissions')}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          {submitting ? (isEditMode ? 'Saving…' : 'Submitting…') : (isEditMode ? 'Save Changes' : 'Submit Book')}
        </button>
      </div>
    </form>
  );
}
