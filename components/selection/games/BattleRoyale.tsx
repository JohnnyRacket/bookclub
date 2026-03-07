'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { mulberry32, shuffleWithSeed } from '@/lib/utils/seeded-random';
import type { GameProps, GameBook } from './types';
import { GAME_COLORS } from './types';

// ── Types ──────────────────────────────────────────────────────────────────

type BattlePhase = 'lineup' | 'countdown' | 'smash' | 'disintegrate' | 'celebration' | 'settle' | 'champion';

type FightEntry = {
  bookA: GameBook;
  bookB: GameBook;
  winnerId: number;
};

// ── Algorithm ──────────────────────────────────────────────────────────────

function buildFights(books: GameBook[], winnerId: number, seed: number): FightEntry[] {
  const shuffled = shuffleWithSeed(books, seed);
  const rng = mulberry32(seed + 77);
  const fights: FightEntry[] = [];
  let champion: GameBook | null = null;

  for (let i = 0; i < shuffled.length; i++) {
    if (champion === null) {
      if (i + 1 >= shuffled.length) break; // only 1 book — skip
      const a = shuffled[i], b = shuffled[i + 1];
      const wi = (a.id === winnerId || b.id === winnerId)
        ? winnerId
        : (rng() > 0.5 ? a.id : b.id);
      fights.push({ bookA: a, bookB: b, winnerId: wi });
      champion = wi === a.id ? a : b;
      i++; // consumed two books
    } else {
      const challenger = shuffled[i];
      const wi: number = (champion.id === winnerId || challenger.id === winnerId)
        ? winnerId
        : (rng() > 0.5 ? champion.id : challenger.id);
      fights.push({ bookA: champion, bookB: challenger, winnerId: wi });
      champion = wi === champion.id ? champion : challenger;
    }
  }

  return fights;
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ── Mini confetti for celebration ──────────────────────────────────────────

function ArenaConfetti() {
  const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc'];
  const particles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.7}s`,
      color: colors[i % colors.length],
      size: `${5 + Math.random() * 7}px`,
      round: Math.random() > 0.5,
      dur: `${0.9 + Math.random() * 0.6}s`,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animation: `confettiFall ${p.dur} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function CelebrationWinner({ book, color }: { book: GameBook; color: string }) {
  return (
    <div
      className="flex flex-col items-center gap-2 relative z-10"
      style={{ animation: 'pop-in 0.45s cubic-bezier(0.34,1.4,0.64,1) forwards' }}
    >
      <div style={{ fontSize: 28 }}>🏆</div>
      <div
        className="rounded-2xl overflow-hidden shadow-xl"
        style={{ width: 100, height: 134, background: color, flexShrink: 0 }}
      >
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ fontSize: 40 }}>📖</span>
          </div>
        )}
      </div>
      <p
        className="text-center font-bold leading-tight"
        style={{ fontFamily: 'var(--font-fredoka)', fontSize: 14, maxWidth: 130, color: 'var(--color-primary)' }}
      >
        {book.title.length > 30 ? book.title.slice(0, 28) + '…' : book.title}
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function BattleRoyale({ books, winnerId, seed, onComplete }: GameProps) {
  const [phase, setPhase] = useState<BattlePhase>('lineup');
  const [fightIndex, setFightIndex] = useState(-1);
  const [countdownNum, setCountdownNum] = useState(3);
  const [defeatedIds, setDefeatedIds] = useState<Set<number>>(new Set());
  const [showImpact, setShowImpact] = useState(false);
  const [champion, setChampion] = useState<GameBook | null>(null);

  const fightsRef = useRef<FightEntry[]>([]);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Stable per-book color derived from shuffled order — computed during render
  const colorMap = useMemo(() => {
    const map = new Map<number, string>();
    const shuffled = shuffleWithSeed(books, seed);
    shuffled.forEach((book, i) => {
      map.set(book.id, GAME_COLORS[i % GAME_COLORS.length]);
    });
    return map;
  }, [books, seed]);

  // Pre-compute fights on mount
  useEffect(() => {
    fightsRef.current = buildFights(books, winnerId, seed);
  }, [books, seed, winnerId]);

  // Animation loop (runs once on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    cancelledRef.current = false;

    async function run() {
      await delay(100); // let pre-compute ref settle
      if (cancelledRef.current) return;

      const fights = fightsRef.current;

      // Edge case: 0 or 1 books
      if (!fights.length) {
        const champ = books.find(b => b.id === winnerId) ?? books[0] ?? null;
        setChampion(champ);
        setPhase('champion');
        await delay(2000);
        if (!cancelledRef.current) onCompleteRef.current();
        return;
      }

      // Lineup: books fan in with stagger
      setPhase('lineup');
      setFightIndex(-1);
      await delay(1200);

      for (let i = 0; i < fights.length; i++) {
        if (cancelledRef.current) return;

        setFightIndex(i);

        // Countdown: 3 → 2 → 1 → FIGHT!
        setPhase('countdown');
        for (let c = 3; c >= 0; c--) {
          if (cancelledRef.current) return;
          setCountdownNum(c);
          await delay(750);
        }

        // Smash: impact flash + shake
        if (cancelledRef.current) return;
        setPhase('smash');
        setShowImpact(true);
        await delay(150);
        setShowImpact(false);
        await delay(350);

        // Disintegrate: loser flies out, winner bounces
        if (cancelledRef.current) return;
        setPhase('disintegrate');
        await delay(800);

        // Mark loser defeated before transitioning — queue sees opacity:0 immediately
        if (cancelledRef.current) return;
        const loserBook = fights[i].winnerId === fights[i].bookA.id
          ? fights[i].bookB
          : fights[i].bookA;
        setDefeatedIds(prev => new Set([...prev, loserBook.id]));

        // Celebration: winner centered, confetti, time for club to react
        setPhase('celebration');
        await delay(3000);

        // Settle: brief pause before next fight — keep celebration card visible (no loser replay)
        if (cancelledRef.current) return;
        setPhase('settle');
        await delay(700);
      }

      if (cancelledRef.current) return;
      const champ = books.find(b => b.id === winnerId) ?? null;
      setChampion(champ);
      setPhase('champion');
      await delay(2000);
      if (!cancelledRef.current) onCompleteRef.current();
    }

    run();
    return () => { cancelledRef.current = true; };
  }, []); // intentional empty deps — runs once on mount

  // ── Champion screen ──────────────────────────────────────────────────────

  if (phase === 'champion' && champion) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 animate-page-in">
        <div className="text-5xl" style={{ animation: 'pop-in 0.5s cubic-bezier(0.34,1.4,0.64,1) forwards' }}>
          🏆
        </div>
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}
        >
          Champion!
        </p>
        {champion.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={champion.cover_url} alt={champion.title} className="w-24 rounded-xl shadow-lg" />
        )}
        <p className="text-xl font-semibold" style={{ fontFamily: 'var(--font-fredoka)' }}>
          {champion.title}
        </p>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          {champion.author}
        </p>
      </div>
    );
  }

  // ── Arena ────────────────────────────────────────────────────────────────

  const fights = fightsRef.current;
  const currentFight = fightIndex >= 0 ? fights[fightIndex] : null;

  const inArena = new Set<number>();
  if (currentFight) {
    inArena.add(currentFight.bookA.id);
    inArena.add(currentFight.bookB.id);
  }

  const showFightResult = phase === 'disintegrate' || phase === 'celebration' || phase === 'settle';
  const loserId = showFightResult && currentFight
    ? (currentFight.winnerId === currentFight.bookA.id
      ? currentFight.bookB.id
      : currentFight.bookA.id)
    : null;

  // Extend celebration through settle so fighters don't re-mount (fixes loser replay bug)
  const isCelebrating = phase === 'celebration' || phase === 'settle';

  const celebrationWinner = isCelebrating && currentFight
    ? (currentFight.winnerId === currentFight.bookA.id ? currentFight.bookA : currentFight.bookB)
    : null;

  return (
    <div className="w-full max-w-2xl mx-auto px-2 flex flex-col gap-4">

      {/* Arena — full width */}
      <div
        className="relative flex flex-col items-center justify-center gap-3 rounded-2xl"
        style={{
          minHeight: 260,
          border: currentFight ? '2px solid var(--border)' : 'none',
          background: currentFight ? 'color-mix(in oklch, var(--color-primary) 5%, white)' : 'transparent',
          padding: '14px 10px',
          transition: 'border 0.3s ease, background 0.3s ease',
        }}
      >
        {/* Impact flash overlay */}
        {showImpact && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: 'white', zIndex: 10, opacity: 0.85 }}
          />
        )}

        {/* Celebration confetti */}
        {isCelebrating && <ArenaConfetti />}

        {/* Placeholder before first fight */}
        {!currentFight && (
          <div className="text-center" style={{ opacity: 0.4 }}>
            <div className="text-4xl mb-1">⚔️</div>
            <p className="text-sm" style={{ fontFamily: 'var(--font-nunito)' }}>
              Get ready...
            </p>
          </div>
        )}

        {/* Active fight */}
        {currentFight && (
          <>
            {/* Celebration/settle: winner centered and prominent — no fighters re-mount */}
            {isCelebrating && celebrationWinner ? (
              <CelebrationWinner
                book={celebrationWinner}
                color={colorMap.get(celebrationWinner.id) ?? GAME_COLORS[0]}
              />
            ) : (
              /* Countdown / smash / disintegrate: fighters side by side */
              <div
                className="flex items-start justify-center gap-2 w-full"
                style={{ animation: phase === 'smash' ? 'battleShake 0.4s ease-in-out' : 'none' }}
              >
                <ArenaFighter
                  book={currentFight.bookA}
                  isLoser={loserId === currentFight.bookA.id}
                  isWinner={showFightResult && currentFight.winnerId === currentFight.bookA.id}
                  color={colorMap.get(currentFight.bookA.id) ?? GAME_COLORS[0]}
                />

                <div
                  style={{
                    fontFamily: 'var(--font-fredoka)',
                    fontSize: 22,
                    fontWeight: 900,
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                    paddingBottom: 28,
                  }}
                >
                  ⚔️
                </div>

                <ArenaFighter
                  book={currentFight.bookB}
                  isLoser={loserId === currentFight.bookB.id}
                  isWinner={showFightResult && currentFight.winnerId === currentFight.bookB.id}
                  color={colorMap.get(currentFight.bookB.id) ?? GAME_COLORS[1]}
                />
              </div>
            )}

            {/* Countdown display */}
            {phase === 'countdown' && (
              <div
                key={countdownNum}
                style={{
                  fontFamily: 'var(--font-fredoka)',
                  fontWeight: 900,
                  lineHeight: 1,
                  fontSize: countdownNum === 0 ? 30 : 60,
                  color: countdownNum === 0 ? 'var(--color-primary)' : 'oklch(0.2 0.04 0)',
                  animation: 'battleCountdownPop 0.35s cubic-bezier(0.34,1.4,0.64,1) forwards',
                }}
              >
                {countdownNum === 0 ? 'FIGHT!' : countdownNum}
              </div>
            )}
          </>
        )}
      </div>

      {/* Waiting queue — horizontal row below arena */}
      <WaitingRow
        books={books}
        inArena={inArena}
        defeatedIds={defeatedIds}
        colorMap={colorMap}
      />
    </div>
  );
}

// ── WaitingRow ───────────────────────────────────────────────────────────────

function WaitingRow({
  books,
  inArena,
  defeatedIds,
  colorMap,
}: {
  books: GameBook[];
  inArena: Set<number>;
  defeatedIds: Set<number>;
  colorMap: Map<number, string>;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {books.map((book) => {
        const hidden = inArena.has(book.id) || defeatedIds.has(book.id);
        const color = colorMap.get(book.id) ?? GAME_COLORS[0];

        return (
          <div
            key={book.id}
            style={{
              opacity: hidden ? 0 : 1,
              transition: 'opacity 0.4s ease',
            }}
          >
            <div
              className="rounded-lg overflow-hidden shadow-sm mx-auto"
              style={{ width: 48, height: 64, background: color }}
            >
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_url}
                  alt={book.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: color }}
                >
                  <span style={{ fontSize: 20 }}>📖</span>
                </div>
              )}
            </div>
            <p
              className="text-center mt-0.5"
              style={{
                fontFamily: 'var(--font-fredoka)',
                fontSize: 9,
                lineHeight: '1.2',
                width: 52,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {book.title}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── ArenaFighter ─────────────────────────────────────────────────────────────

function ArenaFighter({
  book,
  isLoser,
  isWinner,
  color,
}: {
  book: GameBook;
  isLoser: boolean;
  isWinner: boolean;
  color: string;
}) {
  const animation = isLoser
    ? 'battleDisintegrate 0.8s ease-out forwards'
    : isWinner
    ? 'battleVictory 0.5s cubic-bezier(0.34,1.4,0.64,1) forwards'
    : 'none';

  return (
    <div
      className="flex flex-col items-center gap-1 flex-1"
      style={{ animation, maxWidth: 90 }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-md"
        style={{ width: 68, height: 92, background: color, flexShrink: 0 }}
      >
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ fontSize: 30 }}>📖</span>
          </div>
        )}
      </div>
      <p
        className="text-center font-bold leading-tight"
        style={{ fontFamily: 'var(--font-fredoka)', fontSize: 11, maxWidth: 84 }}
      >
        {book.title.length > 24 ? book.title.slice(0, 22) + '…' : book.title}
      </p>
    </div>
  );
}
