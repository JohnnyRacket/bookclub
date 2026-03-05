'use client';

import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { BookSearch } from '@/components/submit/BookSearch';
import { addPastBook } from '@/lib/actions/admin-books';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import type { OLSearchResult } from '@/lib/openlibrary/client';
import Link from 'next/link';

type Step = 'search' | 'form';

export function BackfillBookForm() {
  const [step, setStep] = useState<Step>('search');
  const [prefill, setPrefill] = useState<OLSearchResult | null>(null);
  const [selectedForSearch, setSelectedForSearch] = useState<OLSearchResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [readDate, setReadDate] = useState<Date | undefined>(undefined);
  const [calOpen, setCalOpen] = useState(false);

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
    if (!readDate) { setError('Please select a date read.'); return; }
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await addPastBook(formData);
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
        <div className="rounded-2xl bg-green-50 border border-green-200 px-6 py-8" style={{ fontFamily: 'var(--font-nunito)' }}>
          <p className="text-2xl mb-2">📚</p>
          <p className="text-base font-semibold text-green-800" style={{ fontFamily: 'var(--font-fredoka)' }}>
            Past read added!
          </p>
          <p className="text-sm text-green-700 mt-1">
            The book has been added to your club&apos;s archive.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/past-reads"
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            View Past Reads
          </Link>
          <button
            onClick={() => { setSuccess(false); setStep('search'); setPrefill(null); setSelectedForSearch(null); setCoverPreview(null); setReadDate(undefined); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            Add Another
          </button>
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
        <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-nunito)' }}>
          Cover Image <span className="font-normal normal-case">(optional upload)</span>
        </label>
        <input
          type="file"
          name="cover_file"
          accept="image/*"
          onChange={e => {
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
        <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-nunito)' }}>
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
        <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-nunito)' }}>
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
          <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-nunito)' }}>
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
          <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-nunito)' }}>
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
        <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-nunito)' }}>
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

      {/* Date Read */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-nunito)' }}>
          Date Read <span className="text-red-400">*</span>
        </label>
        <input type="hidden" name="read_date" value={readDate ? format(readDate, 'yyyy-MM-dd') : ''} />
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal rounded-xl border-gray-200 px-3 py-2.5 h-auto text-sm"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              {readDate ? format(readDate, 'MMM d, yyyy') : <span className="text-muted-foreground">Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
            <Calendar
              mode="single"
              selected={readDate}
              onSelect={(d) => { setReadDate(d); setCalOpen(false); }}
              disabled={{ after: new Date() }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
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
        {submitting ? 'Adding…' : 'Add Past Read'}
      </button>
    </form>
  );
}
