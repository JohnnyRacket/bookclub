'use client';

import { useEffect, useRef, useCallback } from 'react';
import { mulberry32 } from '@/lib/utils/seeded-random';
import type { GameProps } from './types';

const PALETTE = [
  { fill: '#d4f0c0', stroke: '#7bbf54' },
  { fill: '#bfe3f5', stroke: '#4a9fc8' },
  { fill: '#fef0b0', stroke: '#d4a820' },
  { fill: '#ffd6e0', stroke: '#d45a7a' },
  { fill: '#e8d5f5', stroke: '#9060c8' },
  { fill: '#ffe4c4', stroke: '#d07030' },
  { fill: '#c0f0e8', stroke: '#3aab90' },
  { fill: '#ffdaf5', stroke: '#c050a0' },
];

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function SpinWheel({ books, winnerId, seed, onComplete }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const draw = useCallback((canvas: HTMLCanvasElement | null, angle: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const n = books.length;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(cx, cy) - 8;
    const segAngle = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Shadow under wheel
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, r, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < n; i++) {
      const start = angle + i * segAngle - Math.PI / 2;
      const end = start + segAngle;
      const palette = PALETTE[i % PALETTE.length];

      // Segment
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = palette.fill;
      ctx.fill();
      ctx.strokeStyle = palette.stroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text along arc
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = palette.stroke;
      const fontSize = Math.max(10, Math.min(14, Math.floor(r / (n * 0.6))));
      ctx.font = `bold ${fontSize}px "Nunito", sans-serif`;
      const label = books[i].title.length > 16 ? books[i].title.slice(0, 14) + '…' : books[i].title;
      ctx.fillText(label, r - 12, 5);
      ctx.restore();
    }

    // Center cap
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = 'var(--color-primary, oklch(0.68 0.18 140))';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [books]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = Math.min(canvas.parentElement?.clientWidth ?? 380, 400);
    canvas.width = size;
    canvas.height = size;

    const n = books.length;
    const segAngle = (2 * Math.PI) / n;
    const winnerIndex = books.findIndex(b => b.id === winnerId);

    const rng = mulberry32(seed);
    const extraRotations = 4 + rng() * 3; // 4–7 full spins
    // Land pointer (at top = -PI/2) on center of winner segment
    // Winner segment center angle (without offset): winnerIndex * segAngle + segAngle/2
    // We want: finalAngle + winnerIndex * segAngle + segAngle/2 = PI/2 (top)
    // so finalAngle = PI/2 - winnerIndex * segAngle - segAngle/2
    const targetAngle = Math.PI / 2 - winnerIndex * segAngle - segAngle / 2;
    const totalRotation = extraRotations * 2 * Math.PI + targetAngle;
    const duration = 7000 + rng() * 2000; // 7–9s

    const startTime = performance.now();
    let startAngle = 0;

    draw(canvas, startAngle);

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const currentAngle = startAngle + totalRotation * easeOut(t);

      draw(canvas, currentAngle);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        draw(canvas, totalRotation);
        if (!doneRef.current) {
          doneRef.current = true;
          setTimeout(onComplete, 800);
        }
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [books, winnerId, seed, draw, onComplete]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pointer */}
      <div className="relative w-full flex justify-center" style={{ height: 0 }}>
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            zIndex: 10,
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '22px solid var(--color-primary, oklch(0.68 0.18 140))',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        style={{ borderRadius: '50%', display: 'block' }}
      />
    </div>
  );
}
