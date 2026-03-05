import Link from 'next/link';
import type { MeetingSettings } from '@/lib/actions/settings';

function formatMeetingDate(unixSec: number) {
  const d = new Date(unixSec * 1000);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    year: d.getFullYear(),
  };
}

export function MeetingCard({ settings }: { settings: MeetingSettings }) {
  const formatted = settings.nextMeetingAt ? formatMeetingDate(settings.nextMeetingAt) : null;

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] p-5">
      <div className="flex items-start justify-between mb-3">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          Next Meeting
        </p>
        <Link
          href="/meeting"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Edit
        </Link>
      </div>

      {formatted ? (
        <div>
          <p
            className="text-lg font-semibold text-foreground leading-snug"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            {formatted.date}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: 'var(--font-nunito)' }}>
            {formatted.time}
            {formatted.year !== new Date().getFullYear() && ` · ${formatted.year}`}
          </p>
          {settings.nextMeetingLocation && (
            <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
              📍 {settings.nextMeetingLocation}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          No date set yet.{' '}
          <Link
            href="/meeting"
            className="font-semibold underline underline-offset-2 hover:no-underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Add one
          </Link>
        </p>
      )}
    </div>
  );
}
