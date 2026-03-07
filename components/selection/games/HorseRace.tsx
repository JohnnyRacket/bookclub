'use client';

import { useEffect, useRef, useState } from 'react';
import { mulberry32 } from '@/lib/utils/seeded-random';
import type { GameProps } from './types';
import { GAME_COLORS } from './types';

// ── Constants ─────────────────────────────────────────────────────────────────
const WORLD_LENGTH = 15000;
const BASE_SPEED = 9;
const VARIANCE = 3;
const WINNER_BIAS = 0.8;
const SURGE_INTERVAL = 100;
const SURGE_BOOST = 15;
const SURGE_DURATION_MIN = 50;
const SURGE_DURATION_MAX = 90;
const SLOWDOWN_THRESHOLD = WORLD_LENGTH * 0.88;
const SLOWDOWN_FACTOR = 0.4;
const RUBBER_BAND = 0.025; // speed bonus per world-unit behind leader
const LEADER_TARGET_X = 0.35;
const BG_PARALLAX = 0.08;
const BG_STRIPE_SIZE = 120;

// ── Winner Scenarios ──────────────────────────────────────────────────────────
const WINNER_SCENARIOS = [
  { name: 'wire-to-wire',    mults: [1.30, 1.15, 1.00] as [number, number, number] },
  { name: 'front-then-dip', mults: [1.25, 0.82, 1.30] as [number, number, number] },
  { name: 'steady',          mults: [1.08, 1.08, 1.05] as [number, number, number] },
  { name: 'mid-surge',       mults: [0.90, 1.35, 1.05] as [number, number, number] },
  { name: 'closer',          mults: [0.80, 0.95, 1.45] as [number, number, number] },
  { name: 'last-to-first',   mults: [0.72, 0.85, 1.60] as [number, number, number] },
  { name: 'yo-yo',           mults: [1.22, 0.80, 1.40] as [number, number, number] },
  { name: 'slow-burn',       mults: [0.95, 1.03, 1.25] as [number, number, number] },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type DustParticle = {
  id: number;
  worldX: number;
  laneY: number; // 0–1 fraction of track height
  opacity: number;
  size: number;
};

type SceneryObject = {
  id: number;
  worldX: number;
  type: 'fence' | 'grass' | 'marker';
  label?: string;
};

type SurgeState = { bookIdx: number; remaining: number };

type RaceState = {
  worldPos: number[];
  cameraX: number;
  surges: SurgeState[];
  surgeCooldown: number;
  tick: number;
  done: boolean;
};

type DisplayState = {
  screenXPcts: number[];
  yPcts: number[];
  cameraX: number;
  containerWidth: number;
  finishOpacity: number;
  dust: DustParticle[];
  scenery: SceneryObject[];
  currentLeaderIdx: number;
  finished: boolean;
  winnerIdx: number | null;
};

// ── SceneryItem ───────────────────────────────────────────────────────────────
function SceneryItem({
  obj,
  cameraX,
  containerWidth,
  trackHeight,
}: {
  obj: SceneryObject;
  cameraX: number;
  containerWidth: number;
  trackHeight: number;
}) {
  const leftPct = ((obj.worldX - cameraX) / containerWidth) * 100;

  if (obj.type === 'fence') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${leftPct}%`,
          top: 0,
          bottom: 0,
          width: 6,
          background: 'oklch(0.75 0.08 65)',
          borderRadius: 2,
          transform: 'translateX(-50%)',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '20%',
          left: -4,
          right: -4,
          height: 3,
          background: 'oklch(0.82 0.06 65)',
          borderRadius: 1,
        }} />
        <div style={{
          position: 'absolute',
          top: '55%',
          left: -4,
          right: -4,
          height: 3,
          background: 'oklch(0.82 0.06 65)',
          borderRadius: 1,
        }} />
      </div>
    );
  }

  if (obj.type === 'grass') {
    return (
      <div
        style={{
          position: 'absolute',
          left: `${leftPct}%`,
          bottom: 6,
          fontSize: 16,
          transform: 'translateX(-50%)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        🌿
      </div>
    );
  }

  // marker
  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: 0,
        height: trackHeight,
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontSize: 9,
        fontWeight: 'bold',
        color: 'oklch(0.35 0.05 65)',
        fontFamily: 'var(--font-nunito)',
        background: 'oklch(0.92 0.04 85)',
        padding: '1px 3px',
        borderRadius: 3,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {obj.label}
      </div>
      <div style={{ width: 2, flex: 1, background: 'oklch(0.55 0.06 65)' }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function HorseRace({ books, winnerId, seed, onComplete }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidthRef = useRef(600);
  const raceStateRef = useRef<RaceState | null>(null);
  const yPositionsRef = useRef<number[]>([]);  // 0–1 fraction of track height
  const yPhasesRef = useRef<number[]>([]);
  const paceMultsRef = useRef<[number, number, number][]>([]);
  const dustRef = useRef<DustParticle[]>([]);
  const sceneryRef = useRef<SceneryObject[]>([]);
  const sceneryIdRef = useRef(0);
  const scenerySpawnCooldownRef = useRef(0);
  const dustIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const winnerIndex = books.findIndex(b => b.id === winnerId);

  const trackHeight = Math.max(200, Math.min(400, books.length * 45 + 60));
  const outerHeight = trackHeight + 40;

  const [display, setDisplay] = useState<DisplayState>(() => ({
    screenXPcts: books.map(() => 0),
    yPcts: books.map((_, i) => (books.length === 1 ? 50 : (i / (books.length - 1)) * 100)),
    cameraX: 0,
    containerWidth: 600,
    finishOpacity: 0,
    dust: [],
    scenery: [],
    currentLeaderIdx: 0,
    finished: false,
    winnerIdx: null,
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    containerWidthRef.current = container.clientWidth || 600;
    const rng = mulberry32(seed);

    // Assign Y positions: evenly spaced with slight jitter
    yPositionsRef.current = books.map((_, i) => {
      const base = books.length === 1 ? 0.5 : i / (books.length - 1);
      const jitter = (rng() - 0.5) * 0.08;
      return Math.max(0.05, Math.min(0.95, base + jitter));
    });

    // Per-book sine phase offsets for Y drift
    yPhasesRef.current = books.map(() => rng() * Math.PI * 2);

    // Phase multipliers: winner gets a narrative scenario, others get random
    paceMultsRef.current = books.map((_, i) => {
      if (i === winnerIndex) {
        const scenario = WINNER_SCENARIOS[seed % WINNER_SCENARIOS.length];
        return scenario.mults;
      }
      return [
        0.88 + rng() * 0.24,  // [0.88, 1.12]
        0.88 + rng() * 0.24,  // [0.88, 1.12]
        0.88 + rng() * 0.24,  // [0.88, 1.12]
      ] as [number, number, number];
    });

    raceStateRef.current = {
      worldPos: books.map(() => 0),
      cameraX: 0,
      surges: [],
      surgeCooldown: SURGE_INTERVAL,
      tick: 0,
      done: false,
    };

    dustRef.current = [];
    sceneryRef.current = [];
    scenerySpawnCooldownRef.current = 0;

    function tick() {
      const state = raceStateRef.current!;
      if (state.done) return;

      const cw = containerWidthRef.current;
      state.tick++;
      const t = state.tick;

      // Find leader
      const maxPos = Math.max(...state.worldPos);
      const leaderIdx = state.worldPos.indexOf(maxPos);

      // Surge: spawn new surges on cooldown
      state.surgeCooldown--;
      if (state.surgeCooldown <= 0) {
        state.surgeCooldown = SURGE_INTERVAL;
        const count = 1 + (rng() > 0.6 ? 1 : 0);
        for (let s = 0; s < count; s++) {
          const bookIdx = Math.floor(rng() * books.length);
          const duration = SURGE_DURATION_MIN + Math.floor(rng() * (SURGE_DURATION_MAX - SURGE_DURATION_MIN));
          state.surges.push({ bookIdx, remaining: duration });
        }
      }
      state.surges = state.surges.filter(s => s.remaining-- > 0);

      // Physics
      const winnerPosNow = state.worldPos[winnerIndex];
      for (let i = 0; i < books.length; i++) {
        if (state.worldPos[i] >= WORLD_LENGTH) continue;
        const isWinner = i === winnerIndex;
        const isSurging = state.surges.some(s => s.bookIdx === i);
        const behindLeader = maxPos - state.worldPos[i];

        const racePct = state.worldPos[i] / WORLD_LENGTH;
        const [em, mm, lm] = paceMultsRef.current[i];
        let phaseMult: number;
        if (racePct < 0.40) {
          phaseMult = em;
        } else if (racePct < 0.70) {
          const t = (racePct - 0.40) / 0.30;
          phaseMult = em + (mm - em) * t;
        } else {
          const t = Math.min(1, (racePct - 0.70) / 0.18);
          phaseMult = mm + (lm - mm) * t;
        }

        let speed = BASE_SPEED * phaseMult
                  + rng() * VARIANCE
                  + (isWinner ? WINNER_BIAS : 0);
        if (isSurging) speed += SURGE_BOOST;
        speed += behindLeader * RUBBER_BAND;
        if (state.worldPos[i] >= SLOWDOWN_THRESHOLD) speed *= SLOWDOWN_FACTOR;

        let newPos = Math.min(state.worldPos[i] + speed, WORLD_LENGTH);
        if (!isWinner && winnerPosNow >= SLOWDOWN_THRESHOLD) {
          newPos = Math.min(newPos, winnerPosNow + 80);
        }
        state.worldPos[i] = newPos;
      }

      // Camera: keep leader at LEADER_TARGET_X of container width
      const newMaxPos = Math.max(...state.worldPos);
      state.cameraX = Math.max(0, newMaxPos - LEADER_TARGET_X * cw);

      // Scenery: spawn and cull
      scenerySpawnCooldownRef.current--;
      if (scenerySpawnCooldownRef.current <= 0) {
        scenerySpawnCooldownRef.current = 45 + Math.floor(rng() * 25);
        const spawnWorldX = state.cameraX + cw * 1.2;
        const typeRoll = rng();
        const type: SceneryObject['type'] = typeRoll < 0.33 ? 'fence' : typeRoll < 0.66 ? 'grass' : 'marker';
        const markerKm = Math.round(spawnWorldX / 1000);
        sceneryRef.current.push({
          id: sceneryIdRef.current++,
          worldX: spawnWorldX,
          type,
          label: type === 'marker' ? `${markerKm}k` : undefined,
        });
      }
      sceneryRef.current = sceneryRef.current.filter(s => s.worldX > state.cameraX - cw * 0.2);

      // Dust: spawn behind each book, fade out
      for (let i = 0; i < books.length; i++) {
        dustRef.current.push({
          id: dustIdRef.current++,
          worldX: state.worldPos[i] - 20,
          laneY: yPositionsRef.current[i],
          opacity: 0.6,
          size: 3 + Math.floor(rng() * 4),
        });
      }
      dustRef.current = dustRef.current
        .map(d => ({ ...d, opacity: d.opacity - 0.05 }))
        .filter(d => d.opacity > 0.05);

      // Finish line opacity: fade in as leader crosses 60%–70% of WORLD_LENGTH
      const leaderPct = newMaxPos / WORLD_LENGTH;
      const finishOpacity = Math.min(1, Math.max(0, (leaderPct - 0.6) / 0.1));

      // Y drift: sine wave per book
      const yPcts = books.map((_, i) => {
        const base = yPositionsRef.current[i];
        const phase = yPhasesRef.current[i];
        const drift = Math.sin(t * 0.03 + phase) * 0.03;
        return (base + drift) * 100;
      });

      // Screen X
      const screenXPcts = state.worldPos.map(wp => ((wp - state.cameraX) / cw) * 100);

      setDisplay({
        screenXPcts,
        yPcts,
        cameraX: state.cameraX,
        containerWidth: cw,
        finishOpacity,
        dust: [...dustRef.current],
        scenery: [...sceneryRef.current],
        currentLeaderIdx: leaderIdx,
        finished: false,
        winnerIdx: null,
      });

      // Check win
      if (state.worldPos[winnerIndex] >= WORLD_LENGTH && !state.done) {
        state.done = true;
        setDisplay(prev => ({ ...prev, finished: true, winnerIdx: winnerIndex }));
        setTimeout(() => onCompleteRef.current(), 1500);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (raceStateRef.current) raceStateRef.current.done = true;
    };
  }, [books, winnerId, seed, winnerIndex]);

  const {
    screenXPcts, yPcts, cameraX, containerWidth,
    finishOpacity, dust, scenery,
    currentLeaderIdx, finished, winnerIdx,
  } = display;

  const finishScreenXPct = ((WORLD_LENGTH - cameraX) / containerWidth) * 100;
  const bgOffsetX = -((cameraX * BG_PARALLAX) % BG_STRIPE_SIZE);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', height: outerHeight, width: '100%' }}
    >
      {/* Track: dirt background, scenery, dust, finish line */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 0,
          right: 0,
          height: trackHeight,
          overflow: 'hidden',
          borderRadius: 12,
          background: `repeating-linear-gradient(
            90deg,
            oklch(0.72 0.05 65) 0px,
            oklch(0.72 0.05 65) 118px,
            oklch(0.66 0.07 65) 118px,
            oklch(0.66 0.07 65) 120px
          )`,
          backgroundPositionX: `${bgOffsetX}px`,
          border: '2px solid oklch(0.58 0.07 65)',
          boxShadow: 'inset 0 2px 10px oklch(0.50 0.06 65 / 0.4)',
        }}
      >
        {scenery.map(obj => (
          <SceneryItem
            key={obj.id}
            obj={obj}
            cameraX={cameraX}
            containerWidth={containerWidth}
            trackHeight={trackHeight}
          />
        ))}

        {dust.map(d => {
          const screenX = ((d.worldX - cameraX) / containerWidth) * 100;
          const screenY = d.laneY * trackHeight;
          return (
            <div
              key={d.id}
              style={{
                position: 'absolute',
                left: `${screenX}%`,
                top: screenY,
                width: d.size,
                height: d.size,
                borderRadius: '50%',
                background: 'oklch(0.82 0.04 75)',
                opacity: d.opacity,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {finishOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${finishScreenXPct}%`,
              top: 0,
              bottom: 0,
              width: 14,
              transform: 'translateX(-50%)',
              opacity: finishOpacity,
              background: 'repeating-linear-gradient(180deg, #111 0px, #111 8px, #fff 8px, #fff 16px)',
              zIndex: 10,
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: 10,
              fontWeight: 'bold',
              color: '#111',
              background: 'white',
              padding: '1px 4px',
              borderRadius: 3,
              marginBottom: 2,
              fontFamily: 'var(--font-nunito)',
            }}>
              FINISH 🏁
            </div>
          </div>
        )}
      </div>

      {/* Books: outside track div so they can overflow vertically */}
      {books.map((book, i) => {
        const isLeader = currentLeaderIdx === i && !finished;
        const isWinner = winnerIdx === i;
        const color = GAME_COLORS[i % GAME_COLORS.length];
        const isCrossed = finished && isWinner;
        const bookTopPx = 20 + (yPcts[i] / 100) * trackHeight;
        const zIndex = 10 + Math.round(yPcts[i]);
        const title = book.title.length > 16 ? book.title.slice(0, 14) + '…' : book.title;

        return (
          <div
            key={book.id}
            style={{
              position: 'absolute',
              left: `${screenXPcts[i]}%`,
              top: bookTopPx,
              transform: 'translate(-50%, -50%)',
              zIndex,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            {isLeader && (
              <div style={{ fontSize: 13, lineHeight: 1, marginBottom: 1 }}>👑</div>
            )}
            {isWinner && (
              <div style={{
                fontSize: 20,
                lineHeight: 1,
                marginBottom: 2,
                animation: 'pop-in 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) forwards',
              }}>
                🏆
              </div>
            )}
            <div
              style={{
                width: 44,
                height: 56,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: isLeader
                  ? '0 0 0 2px oklch(0.85 0.15 80), 0 2px 8px rgba(0,0,0,0.4)'
                  : '0 2px 6px rgba(0,0,0,0.35)',
                animation: isCrossed ? 'none' : 'horseRun 0.25s ease-in-out infinite alternate',
              }}
            >
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_url}
                  alt={book.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}>
                  📖
                </div>
              )}
            </div>
            <p style={{
              fontSize: 9,
              fontFamily: 'var(--font-nunito)',
              fontWeight: 600,
              marginTop: 2,
              color: 'oklch(0.15 0.03 65)',
              maxWidth: 60,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              background: 'oklch(0.97 0.02 85 / 0.85)',
              borderRadius: 2,
              padding: '0 2px',
            }}>
              {title}
            </p>
          </div>
        );
      })}

      <style>{`
        @keyframes horseRun {
          from { transform: translateY(-2px) rotate(-1deg); }
          to   { transform: translateY(2px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
