'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookSearch } from '@/components/submit/BookSearch';
import { BookForm } from '@/components/submit/BookForm';
import type { OLSearchResult } from '@/lib/openlibrary/client';

export default function SubmitPage() {
  const [selected, setSelected] = useState<OLSearchResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
      >
        <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-10 max-w-sm w-full text-center animate-page-in">
          <div className="text-5xl mb-4">🎉</div>
          <h2
            className="text-2xl font-semibold text-foreground mb-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Book submitted!
          </h2>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-nunito)' }}>
            Your suggestion has been sent to the admin for review.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setSubmitted(false); setSelected(null); }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
            >
              Submit another
            </button>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            ← Back
          </Link>
          <h1
            className="text-3xl font-semibold text-foreground mt-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Suggest a Book
          </h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
            Search to pre-fill details, or fill in the form manually.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-6 space-y-6 animate-page-in">
          {/* Search */}
          <BookSearch onSelect={(r) => setSelected(r)} selected={selected} onClear={() => setSelected(null)} />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
              {selected ? 'Edit details below' : 'or fill in manually'}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <BookForm prefill={selected} onSuccess={() => setSubmitted(true)} />
        </div>
      </div>
    </div>
  );
}
