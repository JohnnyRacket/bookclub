'use client';

import { useEffect, useRef, useState } from 'react';
import { mulberry32 } from '@/lib/utils/seeded-random';
import type { GameProps } from './types';
import { GAME_COLORS } from './types';

const BASE_SPEED = 0.18;
const VARIANCE = 0.12;
const SURGE_INTERVAL = 80; // ticks between surges
const SURGE_BOOST = 0.4;
const WINNER_BIAS = 0.04;
const SLOW_ZONE = 95; // % where slow-motion kicks in
const SLOW_FACTOR = 0.25;

type DustParticle = { id: number; x: number; y: number; opacity: number; size: number };

export function HorseRace({ books, winnerId, seed, onComplete }: GameProps) {
  const [positions, setPositions] = useState<number[]>(() => books.map(() => 0));
  const [finished, setFinished] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [dust, setDust] = useState<DustParticle[]>([]);
  const tickRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const dustIdRef = useRef(0);

  const winnerIndex = books.findIndex(b => b.id === winnerId);

  useEffect(() => {
    const rng = mulberry32(seed);
    const pos = books.map(() => 0);
    let done = false;

    function tick() {
      if (done) return;
      tickRef.current++;
      const t = tickRef.current;

      // Speed surge: every SURGE_INTERVAL ticks, one random horse gets a burst
      let surgeIndex = -1;
      if (t % SURGE_INTERVAL === 0) {
        surgeIndex = Math.floor(rng() * books.length);
      }

      let allInSlow = pos.every(p => p >= SLOW_ZONE);

      for (let i = 0; i < books.length; i++) {
        if (pos[i] >= 100) continue;
        const isWinner = i === winnerIndex;
        let speed = BASE_SPEED + rng() * VARIANCE + (isWinner ? WINNER_BIAS : 0);
        if (i === surgeIndex) speed += SURGE_BOOST;
        // Slow motion in final stretch
        if (pos[i] >= SLOW_ZONE || allInSlow) speed *= SLOW_FACTOR;
        pos[i] = Math.min(pos[i] + speed, 100);
      }

      // Add dust particles behind each horse
      const newDust: DustParticle[] = books.map((_, i) => ({
        id: dustIdRef.current++,
        x: pos[i],
        y: i,
        opacity: 0.7,
        size: 4 + Math.floor(rng() * 4),
      }));

      setPositions([...pos]);
      setDust(prev => [
        ...prev.filter(d => d.opacity > 0.05).map(d => ({ ...d, opacity: d.opacity - 0.06 })),
        ...newDust,
      ]);

      // Check finish: winner crosses 100
      if (pos[winnerIndex] >= 100 && !done) {
        done = true;
        doneRef.current = true;
        setFinished(true);
        setWinnerIdx(winnerIndex);
        setTimeout(onComplete, 1500);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      done = true;
    };
  }, [books, winnerId, seed, winnerIndex, onComplete]);

  const laneHeight = Math.max(56, Math.min(80, Math.floor(400 / books.length)));

  return (
    <div className="w-full space-y-2">
      {/* Track header */}
      <div className="flex justify-between items-center mb-1 px-1">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          Start
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          Finish 🏁
        </span>
      </div>

      {books.map((book, i) => {
        const pos = positions[i] ?? 0;
        const isWinner = winnerIdx === i;
        const color = GAME_COLORS[i % GAME_COLORS.length];
        const isCrossed = finished && pos >= 100;

        return (
          <div
            key={book.id}
            className="relative overflow-hidden rounded-xl"
            style={{
              height: laneHeight,
              background: isWinner
                ? 'oklch(0.94 0.08 145)'
                : `color-mix(in oklch, ${color} 20%, white)`,
              border: `2px solid ${isWinner ? 'oklch(0.65 0.18 145)' : color}`,
              transition: 'background 0.5s, border-color 0.5s',
            }}
          >
            {/* Grass lane stripe */}
            <div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(90deg, transparent, transparent 40px, ${color}22 40px, ${color}22 41px)`,
              }}
            />

            {/* Dust particles */}
            {dust.filter(d => d.y === i).map(d => (
              <div
                key={d.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: d.size,
                  height: d.size,
                  left: `calc(${d.x}% - ${d.size * 2}px)`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'oklch(0.75 0.04 85)',
                  opacity: d.opacity,
                }}
              />
            ))}

            {/* Horse (book cover) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
              style={{
                left: `${pos}%`,
                transform: `translateY(-50%) translateX(-100%)`,
                transition: 'none',
                zIndex: 2,
              }}
            >
              {book.cover_url ? (
                <div
                  className="rounded shadow-sm overflow-hidden flex-shrink-0"
                  style={{
                    width: laneHeight - 12,
                    height: laneHeight - 4,
                    animation: isCrossed ? 'none' : 'horseRun 0.25s ease-in-out infinite alternate',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  className="rounded shadow-sm flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    width: laneHeight - 12,
                    height: laneHeight - 4,
                    background: color,
                    animation: isCrossed ? 'none' : 'horseRun 0.25s ease-in-out infinite alternate',
                  }}
                >
                  📖
                </div>
              )}
            </div>

            {/* Book label */}
            <div
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
              style={{ maxWidth: '40%' }}
            >
              <p
                className="text-xs font-bold leading-tight truncate"
                style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-fredoka)' }}
              >
                {book.title}
              </p>
            </div>

            {/* Finish line */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1"
              style={{
                background: 'repeating-linear-gradient(180deg, #111 0px, #111 6px, #fff 6px, #fff 12px)',
                opacity: 0.7,
              }}
            />

            {/* Winner crown */}
            {isWinner && finished && (
              <div
                className="absolute right-2 top-1/2 -translate-y-1/2 text-2xl"
                style={{ animation: 'pop-in 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) forwards' }}
              >
                🏆
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes horseRun {
          from { transform: translateY(-1px); }
          to   { transform: translateY(2px); }
        }
      `}</style>
    </div>
  );
}
