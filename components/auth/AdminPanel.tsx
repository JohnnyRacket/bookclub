'use client';

import { useTransition } from 'react';
import { deleteUserSessions, resetUserPin, type MemberRow } from '@/lib/actions/admin';

function formatDate(unixSec: number) {
  return new Date(unixSec * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MemberActions({ member }: { member: MemberRow }) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await deleteUserSessions(member.id);
    });
  }

  function handleResetPin() {
    if (!confirm(`Reset ${member.name}'s PIN? They will be logged out and must set a new PIN.`)) return;
    startTransition(async () => {
      await resetUserPin(member.id);
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleLogout}
        disabled={isPending || member.sessionCount === 0}
        className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background
                   text-muted-foreground hover:text-foreground hover:bg-muted
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Sign out
      </button>
      <button
        onClick={handleResetPin}
        disabled={isPending}
        className="px-3 py-1.5 text-xs rounded-xl border border-destructive/30 bg-background
                   text-destructive/70 hover:text-destructive hover:bg-destructive/5
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Reset PIN
      </button>
    </div>
  );
}

export function AdminPanel({ members }: { members: MemberRow[] }) {
  return (
    <div className="w-full max-w-2xl animate-page-in">
      {/* Header */}
      <div className="mb-8 stagger">
        <div className="flex items-center gap-3 mb-1">
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
          <span
            className="text-xs tracking-[0.25em] uppercase"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-geist-sans)' }}
          >
            Admin
          </span>
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
        </div>
        <h1
          className="text-4xl font-light leading-tight tracking-wide text-foreground/90 mt-3 text-center"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Members
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {members.length} member{members.length !== 1 ? 's' : ''} in the club
        </p>
      </div>

      {/* Member list */}
      <div className="rounded-3xl bg-card border border-border shadow-[0_2px_20px_oklch(0.18_0.018_65/0.06)] overflow-hidden stagger">
        {members.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No members yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {member.name}
                    </span>
                    {member.pin_reset === 1 && (
                      <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
                        PIN reset
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Joined {formatDate(member.created_at)}</span>
                    <span>·</span>
                    <span>
                      {member.sessionCount} session{member.sessionCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <MemberActions member={member} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground/40 tracking-widest select-none">
        ✦
      </p>
    </div>
  );
}
