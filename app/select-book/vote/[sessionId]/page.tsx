import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getSelectionConfig, getSnapshotForSession, getUserVotesForSession, getSubmittedBooksForVoting } from '@/lib/actions/book-selection';
import { isAdmin, isPinlessMode } from '@/lib/actions/admin';
import { VotingRoom } from '@/components/selection/VotingRoom';

export default async function VotePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getSession();
  if (!session) redirect('/join');

  const { sessionId: sessionIdStr } = await params;
  const sessionId = parseInt(sessionIdStr, 10);

  const [config, snapshot, myVotes, submittedBooks, adminCheck, pinlessCheck] = await Promise.all([
    getSelectionConfig(),
    getSnapshotForSession(sessionId),
    getUserVotesForSession(sessionId),
    getSubmittedBooksForVoting(),
    isAdmin(),
    isPinlessMode(),
  ]);

  if (config.selectionMode !== 'vote') redirect('/');

  if (!snapshot) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
      >
        <div className="text-center">
          <p className="text-4xl mb-4">📭</p>
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            No active voting session
          </h1>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-nunito)' }}>
            This session has ended or doesn&apos;t exist.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <VotingRoom
      initialSnapshot={snapshot}
      submittedBooks={submittedBooks}
      myVotes={myVotes}
      isAdmin={adminCheck}
      isPinless={pinlessCheck}
      votesPerMember={config.votesPerMember}
    />
  );
}
