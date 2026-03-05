'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface MeetingFormProps {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultDatetime: string;
  defaultLocation: string;
}

export function MeetingForm({ action, defaultDatetime, defaultLocation }: MeetingFormProps) {
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
          Date & Time
        </label>
        <DateTimePicker name="next_meeting_at" defaultValue={defaultDatetime} />
      </div>

      <div>
        <label
          className="block text-sm font-semibold mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Location
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          type="text"
          name="next_meeting_location"
          defaultValue={defaultLocation}
          placeholder="e.g. 123 Main St, Apartment 4B"
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
          Meeting details updated!
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
        style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
      >
        {submitting ? 'Saving…' : 'Save Meeting Details'}
      </button>
    </form>
  );
}
