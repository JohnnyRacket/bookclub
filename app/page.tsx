import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { clubConfig } from '@/lib/config';
import { getCurrentBook, getPastBooks } from '@/lib/actions/books';
import { getMySubmissions } from '@/lib/actions/submit';
import { getMeetingSettings } from '@/lib/actions/settings';
import { ActionMenu } from '@/components/ActionMenu';
import { CurrentBookCard } from '@/components/books/CurrentBookCard';
import { PastBookCard } from '@/components/books/PastBookCard';
import { MeetingCard } from '@/components/books/MeetingCard';
import { CountdownCard } from '@/components/books/CountdownCard';

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/join');

  const [currentBook, pastBooks, meetingSettings, mySubmissions] = await Promise.all([
    getCurrentBook(),
    getPastBooks(),
    getMeetingSettings(),
    getMySubmissions(),
  ]);

  const atSubmissionCap = mySubmissions.length >= clubConfig.maxSubmissionsPerMember;

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
            >
              {clubConfig.name}
            </p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
              Hi, {session.name}
            </p>
          </div>
          <ActionMenu atSubmissionCap={atSubmissionCap} />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 animate-page-in">
          {/* Current book — 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <CurrentBookCard book={currentBook} reactPresets={clubConfig.reactPresets} />
          </div>

          {/* Sidebar — meeting info */}
          <div className="space-y-4 stagger">
            <MeetingCard settings={meetingSettings} />
            {meetingSettings.nextMeetingAt && (
              <CountdownCard nextMeetingAt={meetingSettings.nextMeetingAt} />
            )}
          </div>
        </div>

        {/* Past books */}
        {pastBooks.length > 0 && (
          <div className="animate-page-in" style={{ animationDelay: '0.15s' }}>
            <h2
              className="text-lg font-semibold text-foreground mb-4"
              style={{ fontFamily: 'var(--font-fredoka)' }}
            >
              Past Reads
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {pastBooks.map(book => (
                <PastBookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-12" style={{ fontFamily: 'var(--font-nunito)' }}>
          🌿 {clubConfig.name}
        </p>
      </div>
    </div>
  );
}
