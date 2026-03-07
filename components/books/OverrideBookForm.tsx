'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { BookSearch } from '@/components/submit/BookSearch';
import { overrideCurrentBook } from '@/lib/actions/admin-books';
import type { OLSearchResult } from '@/lib/openlibrary/client';

type Step = 'search' | 'form';

export function OverrideBookForm() {
  const [step, setStep] = useState<Step>('search');
  const [prefill, setPrefill] = useState<OLSearchResult | null>(null);
  const [selectedForSearch, setSelectedForSearch] = useState<OLSearchResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  function handleSelect(result: OLSearchResult) {
    setSelectedForSearch(result);
    setPrefill(result);
    setStep('form');
  }

  function handleSkip() {
    setPrefill(null);
    setStep('form');
  }

  function handleBack() {
    setStep('search');
    setSelectedForSearch(null);
    setPrefill(null);
    setCoverPreview(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await overrideCurrentBook(formData);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div
          className="rounded-2xl bg-green-50 border border-green-200 px-6 py-8"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          <p className="text-2xl mb-2">🌟</p>
          <p
            className="text-base font-semibold text-green-800"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Current book updated!
          </p>
          <p className="text-sm text-green-700 mt-1">
            The new book is now set as the club&apos;s current read.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            View Home
          </Link>
          <Link
            href="/admin"
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center text-white transition-all"
            style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'search') {
    return (
      <div className="space-y-4">
        <BookSearch
          onSelect={handleSelect}
          selected={selectedForSearch}
          onClear={() => setSelectedForSearch(null)}
        />
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Skip search — enter manually
          </button>
        </div>
      </div>
    );
  }

  const genres = prefill?.genres?.join(', ') ?? '';
  const coverSrc = coverPreview ?? prefill?.coverUrl ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="cover_url" defaultValue={prefill?.coverUrl ?? ''} />
      <input type="hidden" name="ol_key" defaultValue={prefill?.olKey ?? ''} />

      <button
        type="button"
        onClick={handleBack}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        ← Back to search
      </button>

      {/* Cover preview */}
      {coverSrc && (
        <div className="flex justify-center">
          <img
            src={coverSrc}
            alt="Cover preview"
            className="w-24 object-cover rounded-xl shadow-md"
            style={{ height: '136px' }}
          />
        </div>
      )}

      {/* Cover upload */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Cover Image <span className="font-normal normal-case">(optional upload)</span>
        </label>
        <input
          type="file"
          name="cover_file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
            const url = file ? URL.createObjectURL(file) : null;
            previewUrlRef.current = url;
            setCoverPreview(url);
          }}
          className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>

      {/* Title */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
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

      {/* Author */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
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

      {/* Year + Pages */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Pub. Year
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
          <label
            className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
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

      {/* Genres */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Genres <span className="font-normal normal-case">(comma-separated)</span>
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

      {/* Submissions action */}
      <div>
        <label
          className="block text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Existing submissions <span className="text-red-400">*</span>
        </label>
        <div className="space-y-2">
          <label
            className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-[color:var(--color-primary)] has-[:checked]:bg-[color-mix(in_oklch,var(--color-primary)_6%,white)]"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            <input
              type="radio"
              name="submissions_action"
              value="keep"
              defaultChecked
              className="mt-0.5 accent-[color:var(--color-primary)]"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Keep submissions</p>
              <p className="text-xs text-muted-foreground">
                Members&apos; suggestions are preserved for next time
              </p>
            </div>
          </label>
          <label
            className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            <input
              type="radio"
              name="submissions_action"
              value="delete"
              className="mt-0.5 accent-amber-500"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Delete submissions</p>
              <p className="text-xs text-muted-foreground">
                Clear the queue for a fresh start
              </p>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
      >
        {submitting ? 'Setting current book…' : 'Set as Current Book'}
      </button>
    </form>
  );
}
