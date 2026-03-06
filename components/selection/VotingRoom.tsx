'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoteSession } from '@/hooks/useVoteSession';
import {
  castVote,
  closeVotingSession,
  finalizeVote,
  reopenVotingSession,
  type SessionSnapshot,
  type VotingBook,
} from '@/lib/actions/book-selection';
import { AdminPinModal } from '@/components/auth/AdminPinModal';

type Props = {
  initialSnapshot: SessionSnapshot;
  submittedBooks: VotingBook[];
  myVotes: number[];
  isAdmin: boolean;
  isPinless: boolean;
  votesPerMember: number;
};

function CountdownRing({ seconds, max }: { seconds: number; max: number }) {
  const pct = seconds / max;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative w-14 h-14">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums"
        style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}
      >
        {seconds}
      </span>
    </div>
  );
}

function Confetti() {
  const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => {
        const left = `${Math.random() * 100}%`;
        const delay = `${Math.random() * 1.5}s`;
        const color = colors[i % colors.length];
        const size = `${6 + Math.random() * 8}px`;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left,
              top: '-10px',
              width: size,
              height: size,
              background: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confettiFall ${1.5 + Math.random()}s ${delay} ease-in forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function VotingRoom({ initialSnapshot, submittedBooks, myVotes, isAdmin, isPinless, votesPerMember }: Props) {
  const router = useRouter();
  const { snapshot, viewers } = useVoteSession(initialSnapshot.id, initialSnapshot);
  const prevStatus = useRef(initialSnapshot.status);

  const [selected, setSelected] = useState<Set<number>>(new Set(myVotes));
  const [castState, setCastState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [castError, setCastError] = useState('');
  const [isPending, startTransition] = useTransition();

  const [closingOpen, setClosingOpen] = useState(snapshot.status === 'closed');
  const [countdown, setCountdown] = useState(10);
  const [countdownDone, setCountdownDone] = useState(false);

  const [winnerBook, setWinnerBook] = useState<SessionSnapshot['winner']>(
    initialSnapshot.status === 'finalized' ? (initialSnapshot.winner ?? null) : null
  );
  const [revealOpen, setRevealOpen] = useState(
    initialSnapshot.status === 'finalized' && !!initialSnapshot.winner
  );
  const [finalizing, setFinalizing] = useState(false);
  const [revoting, setRevoting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'finalize' | 'revote' | null>(null);

  // Detect status transitions
  useEffect(() => {
    if (prevStatus.current !== snapshot.status) {
      if (snapshot.status === 'open') {
        setClosingOpen(false);
        setCountdown(10);
        setCountdownDone(false);
        setSelected(new Set());
        setCastState('idle');
      }
      if (snapshot.status === 'closed') {
        setClosingOpen(true);
        setCountdown(10);
        setCountdownDone(false);
      }
      if (snapshot.status === 'finalized' && snapshot.winner) {
        setWinnerBook(snapshot.winner);
        setRevealOpen(true);
        setClosingOpen(false);
      }
      prevStatus.current = snapshot.status;
    }
  }, [snapshot.status, snapshot.winner]);

  // Countdown timer
  useEffect(() => {
    if (!closingOpen || countdownDone) return;
    if (countdown <= 0) {
      setCountdownDone(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [closingOpen, countdown, countdownDone]);

  function toggleBook(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (votesPerMember === 1) {
          next.clear();
        }
        if (next.size < votesPerMember) {
          next.add(id);
        }
      }
      return next;
    });
    setCastState('idle');
  }

  function handleCastVote() {
    setCastState('saving');
    setCastError('');
    startTransition(async () => {
      const res = await castVote(initialSnapshot.id, [...selected]);
      if (res.error) {
        setCastState('error');
        setCastError(res.error);
      } else {
        setCastState('saved');
        window.dispatchEvent(new CustomEvent('vote-session-changed'));
      }
    });
  }

  async function handleCloseVoting() {
    setActionError('');
    startTransition(async () => {
      const res = await closeVotingSession(initialSnapshot.id);
      if (res.error) setActionError(res.error);
    });
  }

  async function doFinalize() {
    setFinalizing(true);
    setActionError('');
    const res = await finalizeVote(initialSnapshot.id);
    if (res.error) {
      setActionError(res.error);
      setFinalizing(false);
    }
    // SSE will push status=finalized and trigger reveal
  }

  async function doRevote() {
    setRevoting(true);
    setActionError('');
    const res = await reopenVotingSession(initialSnapshot.id);
    if (res.error) {
      setActionError(res.error);
      setRevoting(false);
    } else {
      setClosingOpen(false);
      setRevoting(false);
    }
  }

  function handleFinalize() {
    if (isAdmin) {
      doFinalize();
    } else {
      setPendingAction('finalize');
      setPinModalOpen(true);
    }
  }

  function handleRevote() {
    if (isAdmin) {
      doRevote();
    } else {
      setPendingAction('revote');
      setPinModalOpen(true);
    }
  }

  const isOpen = snapshot.status === 'open';

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-page-in">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            Book Club
          </p>
          <h1 className="text-3xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-fredoka)' }}>
            Book Vote
          </h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: isOpen
                  ? 'oklch(0.93 0.07 145)'
                  : 'color-mix(in oklch, oklch(0.65 0.18 25) 15%, white)',
                color: isOpen ? 'oklch(0.42 0.15 145)' : 'oklch(0.65 0.18 25)',
                fontFamily: 'var(--font-nunito)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isOpen ? 'oklch(0.52 0.17 145)' : 'oklch(0.65 0.18 25)' }}
              />
              {isOpen ? 'Voting Open' : snapshot.status === 'closed' ? 'Voting Closed' : 'Finalized'}
            </span>
          </div>
        </div>

        {/* Viewer presence */}
        {viewers.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4 animate-page-in">
            {viewers.map((name) => (
              <div
                key={name}
                title={name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  background: 'color-mix(in oklch, var(--color-primary) 12%, white)',
                  fontFamily: 'var(--font-nunito)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {name[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>{name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Live stats */}
        <div
          className="rounded-2xl px-5 py-4 mb-6 flex items-center justify-between animate-page-in"
          style={{
            background: 'color-mix(in oklch, var(--color-primary) 10%, white)',
            border: '1.5px solid color-mix(in oklch, var(--color-primary) 25%, transparent)',
          }}
        >
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}>
              {snapshot.total_votes_cast}
            </p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
              votes cast
            </p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}>
              {snapshot.total_voters}
              <span className="text-base font-medium text-muted-foreground">
                /{Math.max(snapshot.total_voters, viewers.length)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
              members voted
            </p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}>
              {votesPerMember}
            </p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
              votes each
            </p>
          </div>
        </div>

        {/* Book list (voting) */}
        {isOpen && (
          <div className="space-y-3 animate-page-in">
            <p
              className="text-sm font-semibold text-muted-foreground text-center"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {votesPerMember === 1
                ? 'Select 1 book'
                : `Select up to ${votesPerMember} book${votesPerMember > 1 ? 's' : ''}`}
              {selected.size > 0 && ` · ${selected.size} selected`}
            </p>

            {submittedBooks.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center text-sm text-muted-foreground"
                style={{ background: 'white', fontFamily: 'var(--font-nunito)' }}
              >
                No submitted books to vote on.
              </div>
            ) : (
              submittedBooks.map(book => {
                const isSelected = selected.has(book.id);
                const atCap = !isSelected && selected.size >= votesPerMember;
                return (
                  <button
                    key={book.id}
                    onClick={() => !atCap && toggleBook(book.id)}
                    disabled={atCap || !isOpen}
                    className="w-full text-left rounded-2xl shadow-sm transition-all duration-150"
                    style={{
                      background: isSelected
                        ? 'color-mix(in oklch, var(--color-primary) 12%, white)'
                        : 'white',
                      border: isSelected
                        ? '2px solid var(--color-primary)'
                        : '2px solid #e5e7eb',
                      opacity: atCap ? 0.5 : 1,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-4 px-4 py-3">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                          style={{ background: 'color-mix(in oklch, var(--color-primary) 12%, white)' }}
                        >
                          📖
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{
                            fontFamily: 'var(--font-fredoka)',
                            color: isSelected ? 'var(--color-primary)' : 'inherit',
                          }}
                        >
                          {book.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'var(--font-nunito)' }}>
                          {book.author}
                          {book.submitter_name && <span className="ml-2">· by {book.submitter_name}</span>}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          border: isSelected ? 'none' : '2px solid #d1d5db',
                          background: isSelected ? 'var(--color-primary)' : 'transparent',
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}

            {/* Submit button */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleCastVote}
                disabled={isPending || selected.size === 0}
                className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
              >
                {isPending ? 'Saving…' : castState === 'saved' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    Votes saved! <Check size={15} strokeWidth={2.5} />
                  </span>
                ) : 'Cast My Votes'}
              </button>

              {castState === 'error' && (
                <p className="text-center text-sm text-amber-700" style={{ fontFamily: 'var(--font-nunito)' }}>
                  {castError}
                </p>
              )}

              {isAdmin && (
                <button
                  onClick={handleCloseVoting}
                  disabled={isPending}
                  className="w-full py-2 rounded-2xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  Close Voting
                </button>
              )}
            </div>
          </div>
        )}

        {/* Closing Modal */}
        {closingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div
              className="w-full max-w-md rounded-3xl p-6 shadow-2xl animate-page-in"
              style={{ background: 'white' }}
            >
              <div className="text-center mb-4">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
                >
                  Results
                </p>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-fredoka)' }}>
                  Voting Closed
                </h2>
                <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
                  {snapshot.total_votes_cast} votes from {snapshot.total_voters} members
                </p>
              </div>

              {/* Book results */}
              <div className="space-y-2 mb-5 overflow-y-auto" style={{ maxHeight: '210px' }}>
                {(snapshot.books ?? []).map((book, i) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2"
                    style={{
                      background: i === 0 ? 'color-mix(in oklch, var(--color-primary) 10%, white)' : '#f9fafb',
                      border: i === 0 ? '1.5px solid color-mix(in oklch, var(--color-primary) 30%, transparent)' : '1.5px solid transparent',
                    }}
                  >
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-8 h-11 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-11 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                        style={{ background: 'color-mix(in oklch, var(--color-primary) 12%, white)' }}>📖</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-fredoka)' }}>
                        {i === 0 && <span className="mr-1">🏆</span>}{book.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'var(--font-nunito)' }}>
                        {book.author}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold flex-shrink-0"
                      style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-fredoka)' }}
                    >
                      {book.vote_count}
                    </span>
                  </div>
                ))}
              </div>

              {!countdownDone ? (
                <div className="flex flex-col items-center gap-2 mb-4">
                  <CountdownRing seconds={countdown} max={10} />
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
                    Actions available soon…
                  </p>
                </div>
              ) : null}

              {actionError && (
                <p className="text-center text-sm text-amber-700 mb-3" style={{ fontFamily: 'var(--font-nunito)' }}>
                  {actionError}
                </p>
              )}

              <div className="space-y-2">
                  <button
                    onClick={handleFinalize}
                    disabled={!countdownDone || finalizing || revoting}
                    className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
                  >
                    {finalizing ? 'Finalizing…' : 'Finalize Vote'}
                  </button>
                  <button
                    onClick={handleRevote}
                    disabled={!countdownDone || finalizing || revoting}
                    className="w-full py-2 rounded-2xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'var(--font-nunito)' }}
                  >
                    {revoting ? 'Starting new vote…' : 'Re-vote'}
                  </button>
                </div>
            </div>
          </div>
        )}

        <AdminPinModal
          open={pinModalOpen}
          pinless={isPinless}
          title={pendingAction === 'finalize' ? 'Finalize Vote' : 'Re-vote'}
          onClose={() => { setPinModalOpen(false); setPendingAction(null); }}
          onSuccess={() => pendingAction === 'finalize' ? doFinalize() : doRevote()}
        />

        {/* Winner Reveal Modal */}
        {revealOpen && winnerBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <Confetti />
            <div
              className="w-full max-w-sm rounded-3xl p-8 shadow-2xl relative"
              style={{ background: 'white', animation: 'pop-in 0.5s ease forwards' }}
            >
              <div className="text-center">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
                >
                  And the next read is...
                </p>

                {winnerBook.cover_url ? (
                  <img
                    src={winnerBook.cover_url}
                    alt={winnerBook.title}
                    className="w-32 h-44 object-cover rounded-2xl shadow-lg mx-auto mb-5"
                    style={{ animation: 'pop-in 0.6s 0.2s ease both' }}
                  />
                ) : (
                  <div
                    className="w-32 h-44 rounded-2xl mx-auto mb-5 flex items-center justify-center text-5xl shadow-lg"
                    style={{
                      background: 'color-mix(in oklch, var(--color-primary) 15%, white)',
                      animation: 'pop-in 0.6s 0.2s ease both',
                    }}
                  >
                    📖
                  </div>
                )}

                <h2
                  className="text-2xl font-semibold mb-1"
                  style={{ fontFamily: 'var(--font-fredoka)' }}
                >
                  {winnerBook.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-nunito)' }}>
                  by {winnerBook.author}
                </p>

                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all active:scale-95"
                  style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
                >
                  Let&apos;s go! 🎉
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
