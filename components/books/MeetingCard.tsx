import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { MeetingSettings } from '@/lib/actions/settings';
import { MeetingDateTime } from './MeetingDateTime';

export function MeetingCard({ settings }: { settings: MeetingSettings }) {
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

      {settings.nextMeetingAt ? (
        <div>
          <MeetingDateTime unixSec={settings.nextMeetingAt} />
          {settings.nextMeetingLocation && (
            <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
              <MapPin className="inline-block mr-1 -mt-0.5" size={13} />{settings.nextMeetingLocation}
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
