'use client';

import { useEffect, useState } from 'react';

interface CountdownCardProps {
  nextMeetingAt: number | null;
}

function getCountdown(unixSec: number) {
  const now = Date.now();
  const target = unixSec * 1000;
  const diff = target - now;

  if (diff <= 0) return { label: 'Today!', sub: null };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return { label: `${days} day${days !== 1 ? 's' : ''}`, sub: `${hours}h ${minutes}m` };
  if (hours > 0) return { label: `${hours}h ${minutes}m`, sub: 'away' };
  return { label: `${minutes} min`, sub: 'away' };
}

export function CountdownCard({ nextMeetingAt }: CountdownCardProps) {
  const [countdown, setCountdown] = useState(nextMeetingAt ? getCountdown(nextMeetingAt) : null);

  useEffect(() => {
    if (!nextMeetingAt) return;
    setCountdown(getCountdown(nextMeetingAt));
    const id = setInterval(() => setCountdown(getCountdown(nextMeetingAt)), 60 * 1000);
    return () => clearInterval(id);
  }, [nextMeetingAt]);

  if (!countdown) return null;

  const isToday = countdown.label === 'Today!';

  return (
    <div className="rounded-2xl p-5 text-center">
      <p
        className="text-xs font-bold uppercase tracking-widest mb-1"
        style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
      >
        {isToday ? 'Meeting' : 'Countdown'}
      </p>
      <p
        className="text-3xl font-bold leading-none"
        style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-fredoka)' }}
      >
        {countdown.label}
      </p>
      {countdown.sub && (
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
          {countdown.sub} away
        </p>
      )}
    </div>
  );
}
