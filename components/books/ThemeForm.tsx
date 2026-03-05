'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ThemeFormProps {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultTheme: string;
}

export function ThemeForm({ action, defaultTheme }: ThemeFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          className="block text-sm font-semibold mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Theme
        </label>
        <input
          type="text"
          name="next_book_theme"
          defaultValue={defaultTheme}
          placeholder="e.g. Unreliable narrators, Dystopia, Short stories…"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
          style={{ fontFamily: 'var(--font-nunito)' }}
        />
      </div>

      {error && (
        <div
          className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Theme updated!
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
        style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
      >
        {submitting ? 'Saving…' : 'Save Theme'}
      </button>
    </form>
  );
}
