'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRevealSession } from '@/hooks/useRevealSession';
import { startReveal, markRevealFinished, finalizeReveal, redoReveal } from '@/lib/actions/reveal-session';
import type { RevealSession } from '@/lib/actions/reveal-session';
import { SpinWheel } from './games/SpinWheel';
import { HorseRace } from './games/HorseRace';
import { BattleRoyale } from './games/BattleRoyale';

type Phase = 'lobby' | 'countdown' | 'playing' | 'winner' | 'finalized';

function Confetti() {
  const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 40 }).map((_, i) => {
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
    </div>
  );
}

function PresenceBubbles({ viewers }: { viewers: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {viewers.map((name) => (
        <div
          key={name}
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
  );
}

function CountdownNumber({ n }: { n: number }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 160 }}>
      <span
        key={n}
        className="text-9xl font-black"
        style={{
          fontFamily: 'var(--font-fredoka)',
          color: 'var(--color-primary)',
          animation: 'countdownPop 0.9s cubic-bezier(0.34,1.4,0.64,1) forwards',
        }}
      >
        {n}
      </span>
    </div>
  );
}

type Props = {
  initialSession: RevealSession;
  isAdmin: boolean;
};

export function RevealRoom({ initialSession, isAdmin }: Props) {
  const { session, viewers, startPayload } = useRevealSession(initialSession.id, initialSession);
  const [phase, setPhase] = useState<Phase>(() => {
    if (initialSession.status === 'finalized') return 'finalized';
    if (initialSession.status === 'finished') return 'winner';
    if (initialSession.status === 'playing') return 'playing';
    return 'lobby';
  });
  const [countdown, setCountdown] = useState(3);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [startCooldown, setStartCooldown] = useState(true);

  // 3s start button cooldown
  useEffect(() => {
    const t = setTimeout(() => setStartCooldown(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Received start payload → begin countdown → playing
  useEffect(() => {
    if (!startPayload) return;
    if (phase === 'playing' || phase === 'winner' || phase === 'finalized') return;
    setPhase('countdown');
    setCountdown(3);
  }, [startPayload, phase]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // If session arrives as playing (late-joiner already has startPayload via SSE)
  useEffect(() => {
    if (session.status === 'playing' && phase === 'lobby' && startPayload) {
      setPhase('playing');
    }
    if (session.status === 'finished' && phase === 'playing') {
      setPhase('winner');
    }
    if (session.status === 'finalized') {
      setPhase('finalized');
    }
    // Redo: session reset to lobby AND startPayload cleared → all viewers return to lobby.
    // Requires !startPayload so this doesn't fire during normal play (session.status stays
    // 'lobby' in the hook because startReveal never calls notifyRevealChanged).
    if (session.status === 'lobby' && !startPayload && (phase === 'winner' || phase === 'playing')) {
      setPhase('lobby');
    }
  }, [session.status, phase, startPayload]);

  const handleAnimationComplete = useCallback(async () => {
    setPhase('winner');
    await markRevealFinished(session.id);
  }, [session.id]);

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const res = await startReveal(session.id);
      if (res.error) setError(res.error);
    });
  }

  function handleFinalize() {
    setError(null);
    startTransition(async () => {
      const res = await finalizeReveal(session.id);
      if (res.error) setError(res.error);
    });
  }

  function handleRedo() {
    setError(null);
    startTransition(async () => {
      const res = await redoReveal(session.id);
      if (res.error) setError(res.error);
    });
  }

  const winnerBook = startPayload
    ? startPayload.books.find(b => b.id === startPayload.winner_book_id)
    : session.books.find(b => b.id === session.winner_book_id);

  const gameType = startPayload?.game_type ?? session.game_type;
  const books = startPayload?.books ?? session.books;
  const seed = startPayload?.seed ?? session.seed;
  const winnerId = startPayload?.winner_book_id ?? session.winner_book_id;

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 animate-page-in">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}
          >
            {phase === 'lobby' && 'Book Selection Time!'}
            {phase === 'countdown' && 'Get Ready!'}
            {phase === 'playing' && gameTypeName(gameType)}
            {phase === 'winner' && 'We have a winner!'}
            {phase === 'finalized' && 'Your next read!'}
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
            {phase === 'lobby' && `${viewers.length} member${viewers.length === 1 ? '' : 's'} in the lobby`}
            {phase === 'playing' && 'May the best book win...'}
            {phase === 'winner' && (isAdmin ? 'Make it official when ready!' : 'Waiting for host...')}
            {phase === 'finalized' && 'Happy reading! 🌿'}
          </p>
        </div>

        {/* Presence bubbles */}
        {(phase === 'lobby' || phase === 'countdown') && viewers.length > 0 && (
          <div className="mb-6">
            <PresenceBubbles viewers={viewers} />
          </div>
        )}

        {/* Main content */}
        <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]">
          {/* LOBBY */}
          {phase === 'lobby' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-nunito)' }}>
                  Today&apos;s Contestants ({session.books.length} books)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {session.books.map(book => (
                    <div
                      key={book.id}
                      className="rounded-xl p-2 flex flex-col items-center gap-1.5 text-center"
                      style={{ background: 'color-mix(in oklch, var(--color-primary) 8%, white)' }}
                    >
                      {book.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.cover_url} alt={book.title} className="w-12 rounded-lg shadow-sm" style={{ aspectRatio: '2/3', objectFit: 'cover' }} />
                      ) : (
                        <div className="w-12 h-16 rounded-lg flex items-center justify-center text-xl" style={{ background: 'var(--color-primary)', opacity: 0.7 }}>📖</div>
                      )}
                      <p className="text-xs font-semibold leading-tight" style={{ fontFamily: 'var(--font-fredoka)' }}>
                        {book.title.length > 24 ? book.title.slice(0, 22) + '…' : book.title}
                      </p>
                      {book.submitter_name && (
                        <p className="text-xs text-muted-foreground leading-tight" style={{ fontFamily: 'var(--font-nunito)' }}>
                          by {book.submitter_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Game type badge */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{gameTypeIcon(session.game_type)}</span>
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--color-primary)' }}>
                  {gameTypeName(session.game_type)}
                </span>
              </div>

              {isAdmin ? (
                <button
                  onClick={handleStart}
                  disabled={isPending || startCooldown}
                  className="w-full py-4 rounded-2xl text-white text-lg font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--color-primary)',
                    fontFamily: 'var(--font-fredoka)',
                    boxShadow: '0 6px 0 color-mix(in oklch, var(--color-primary) 60%, black)',
                  }}
                >
                  {isPending ? 'Starting…' : startCooldown ? 'Get Ready…' : `Start the Show! ${gameTypeIcon(session.game_type)}`}
                </button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
                    Waiting for the host to start... 🍃
                  </p>
                </div>
              )}
            </div>
          )}

          {/* COUNTDOWN */}
          {phase === 'countdown' && (
            <CountdownNumber n={countdown} />
          )}

          {/* PLAYING */}
          {phase === 'playing' && startPayload && (
            <div>
              {gameType === 'wheel' && (
                <SpinWheel books={books} winnerId={winnerId} seed={seed} onComplete={handleAnimationComplete} />
              )}
              {gameType === 'horse_race' && (
                <HorseRace books={books} winnerId={winnerId} seed={seed} onComplete={handleAnimationComplete} />
              )}
              {gameType === 'battle' && (
                <BattleRoyale books={books} winnerId={winnerId} seed={seed} onComplete={handleAnimationComplete} />
              )}
            </div>
          )}

          {/* WINNER */}
          {phase === 'winner' && winnerBook && (
            <div className="relative">
              <Confetti />
              <div className="flex flex-col items-center gap-4 py-4 animate-page-in relative z-10">
                <div className="text-5xl" style={{ animation: 'pop-in 0.5s cubic-bezier(0.34,1.4,0.64,1) forwards' }}>🎉</div>
                {winnerBook.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={winnerBook.cover_url}
                    alt={winnerBook.title}
                    className="w-28 rounded-2xl shadow-lg"
                    style={{ aspectRatio: '2/3', objectFit: 'cover', animation: 'pop-in 0.6s 0.2s cubic-bezier(0.34,1.4,0.64,1) both' }}
                  />
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}>
                    {winnerBook.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
                    by {winnerBook.author}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button
                      onClick={handleFinalize}
                      disabled={isPending}
                      className="px-8 py-3 rounded-2xl text-white font-bold transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        background: 'var(--color-primary)',
                        fontFamily: 'var(--font-fredoka)',
                        boxShadow: '0 4px 0 color-mix(in oklch, var(--color-primary) 60%, black)',
                      }}
                    >
                      {isPending ? 'Making it official…' : 'Make it Official! 🌿'}
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={isPending}
                      className="px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        fontFamily: 'var(--font-fredoka)',
                        border: '2px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                        background: 'transparent',
                      }}
                    >
                      Re-roll
                    </button>
                  </div>
                )}
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
                    Waiting for the host to finalize...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* FINALIZED */}
          {phase === 'finalized' && winnerBook && (
            <div className="flex flex-col items-center gap-4 py-4 animate-page-in">
              <p className="text-4xl">📚</p>
              <p className="text-xl font-bold text-center" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}>
                Your next read is set!
              </p>
              {winnerBook.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={winnerBook.cover_url} alt={winnerBook.title} className="w-24 rounded-xl shadow-md" />
              )}
              <p className="text-lg font-semibold text-center" style={{ fontFamily: 'var(--font-fredoka)' }}>{winnerBook.title}</p>
              <a
                href="/"
                className="mt-2 px-6 py-2.5 rounded-xl text-white font-semibold transition-all active:scale-95"
                style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
              >
                Back to Home
              </a>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700" style={{ fontFamily: 'var(--font-nunito)' }}>
            {error}
          </div>
        )}
      </div>

      <style>{`
        @keyframes countdownPop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

function gameTypeName(type: string): string {
  if (type === 'horse_race') return 'Horse Race';
  if (type === 'battle') return 'Battle Royale';
  return 'Spinning Wheel';
}

function gameTypeIcon(type: string): string {
  if (type === 'horse_race') return '🏇';
  if (type === 'battle') return '⚔️';
  return '🎡';
}
