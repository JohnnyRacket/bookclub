import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getMeetingSettings, updateMeetingSettings } from '@/lib/actions/settings';
import { MeetingForm } from '@/components/books/MeetingForm';

export default async function MeetingPage() {
  const session = await getSession();
  if (!session) redirect('/join');

  const settings = await getMeetingSettings();

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-md mx-auto">
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
            Next Meeting
          </h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
            Any member can update the meeting details.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-6 animate-page-in">
          <MeetingForm
            action={updateMeetingSettings}
            defaultTimestamp={settings.nextMeetingAt}
            defaultLocation={settings.nextMeetingLocation ?? ''}
          />
        </div>
      </div>
    </div>
  );
}
