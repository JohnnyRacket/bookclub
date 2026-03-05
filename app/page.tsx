import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getClubConfig } from '@/lib/actions/settings';
import { getCurrentBook, getPastBooks } from '@/lib/actions/books';
import { getMySubmissions } from '@/lib/actions/submit';
import { getMeetingSettings } from '@/lib/actions/settings';
import Image from 'next/image';
import { ActionMenu } from '@/components/ActionMenu';
import { CurrentBookCard } from '@/components/books/CurrentBookCard';
import { PastBookCard } from '@/components/books/PastBookCard';
import { MeetingCard } from '@/components/books/MeetingCard';
import { CountdownCard } from '@/components/books/CountdownCard';

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/join');

  const [currentBook, pastBooks, meetingSettings, mySubmissions, clubConfig] = await Promise.all([
    getCurrentBook(),
    getPastBooks(),
    getMeetingSettings(),
    getMySubmissions(),
    getClubConfig(),
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
          <div className="flex items-center gap-3">
            {clubConfig.logoUrl && (
              <div className="relative h-9 w-9 flex-shrink-0">
                <Image src={clubConfig.logoUrl} alt={clubConfig.name} fill className="object-contain" />
              </div>
            )}
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
          </div>
          <ActionMenu atSubmissionCap={atSubmissionCap} />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 animate-page-in">
          {/* Current book — 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <CurrentBookCard
              book={currentBook}
              reactPresets={clubConfig.reactPresets}
              thumbsUpEmoji={clubConfig.thumbsUpEmoji}
              thumbsDownEmoji={clubConfig.thumbsDownEmoji}
            />
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
        <div className="animate-page-in" style={{ animationDelay: '0.15s' }}>
          <h2
            className="text-lg font-semibold text-foreground mb-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Past Reads
          </h2>
          <div className="w-16 h-0.5 rounded-full mb-4" style={{ background: 'color-mix(in oklch, var(--color-primary) 45%, transparent)' }} />
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {pastBooks.length > 0 ? (
              pastBooks.map(book => (
                <PastBookCard
                  key={book.id}
                  book={book}
                  thumbsUpEmoji={clubConfig.thumbsUpEmoji}
                  thumbsDownEmoji={clubConfig.thumbsDownEmoji}
                />
              ))
            ) : (
              <div
                className="flex-shrink-0 w-36 rounded-2xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center text-center p-4 h-[248px]"
                style={{
                  borderColor: 'color-mix(in oklch, var(--color-primary) 35%, transparent)',
                  background: 'color-mix(in oklch, var(--color-primary) 6%, white)',
                }}
              >
                <svg width="36" height="44" viewBox="0 0 56 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2 opacity-40">
                  {/* Main cover outline */}
                  <rect x="4.75" y="2.75" width="46.5" height="60.5" rx="2.5"
                    style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '4 3' }}
                  />
                  {/* Spine divider */}
                  <line x1="12" y1="2.75" x2="12" y2="63.25"
                    style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '4 3' }}
                  />
                  {/* Title line placeholders */}
                  <line x1="20" y1="22" x2="43" y2="22"
                    style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
                  />
                  <line x1="22" y1="28" x2="40" y2="28"
                    style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
                  />
                  {/* Author line placeholder */}
                  <line x1="24" y1="44" x2="38" y2="44"
                    style={{ stroke: 'var(--color-primary)', strokeWidth: '1.5', strokeDasharray: '3 2.5', strokeLinecap: 'round' }}
                  />
                </svg>
                <p
                  className="text-xs font-semibold leading-snug"
                  style={{ color: 'color-mix(in oklch, var(--color-primary) 70%, black)', fontFamily: 'var(--font-fredoka)' }}
                >
                  Past reads will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12" style={{ fontFamily: 'var(--font-nunito)' }}>
          🌿 {clubConfig.name}
        </p>
      </div>
    </div>
  );
}
