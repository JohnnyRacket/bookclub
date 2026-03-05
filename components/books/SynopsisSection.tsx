'use client';

import { useState } from 'react';

const TRUNCATE_AT = 280;

export function SynopsisSection({ synopsis }: { synopsis: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = synopsis.length > TRUNCATE_AT;
  const displayed = shouldTruncate && !expanded ? synopsis.slice(0, TRUNCATE_AT) + '…' : synopsis;

  return (
    <div className="px-6 pb-4">
      <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-nunito)' }}>
        {displayed}
        {shouldTruncate && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="ml-1.5 text-xs font-semibold underline underline-offset-2 hover:no-underline"
            style={{ color: 'var(--color-primary)' }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>
    </div>
  );
}
