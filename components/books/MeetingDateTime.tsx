'use client';

export function MeetingDateTime({ unixSec }: { unixSec: number }) {
  const d = new Date(unixSec * 1000);
  const date = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const year = d.getFullYear();
  const thisYear = new Date().getFullYear();

  return (
    <>
      <p
        className="text-lg font-semibold text-foreground leading-snug"
        style={{ fontFamily: 'var(--font-fredoka)' }}
      >
        {date}
      </p>
      <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: 'var(--font-nunito)' }}>
        {time}{year !== thisYear && ` · ${year}`}
      </p>
    </>
  );
}
