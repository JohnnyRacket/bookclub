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

// Distinct soft colors for member avatars
const AVATAR_COLORS = [
  'oklch(0.75 0.14 250)',
  'oklch(0.72 0.14 330)',
  'oklch(0.72 0.14 160)',
  'oklch(0.75 0.14 50)',
  'oklch(0.72 0.14 290)',
  'oklch(0.75 0.14 200)',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
        className="px-3 py-1.5 text-xs font-semibold rounded-xl
                   bg-[oklch(0.96_0.008_250)] text-muted-foreground
                   hover:text-foreground
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        Sign out
      </button>
      <button
        onClick={handleResetPin}
        disabled={isPending}
        className="px-3 py-1.5 text-xs font-semibold rounded-xl
                   bg-destructive/8 text-destructive/70
                   hover:bg-destructive/12 hover:text-destructive
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        Reset PIN
      </button>
    </div>
  );
}

export function AdminPanel({ members }: { members: MemberRow[] }) {
  return (
    <div className="w-full max-w-xl animate-page-in">
      {/* Header */}
      <div className="mb-6 text-center stagger">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          Admin
        </p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Members
        </h1>
        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          {members.length} member{members.length !== 1 ? 's' : ''} in the club
        </p>
      </div>

      {/* Member list — each row is its own floating card */}
      <div className="space-y-3 stagger">
        {members.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-10 text-center text-sm text-muted-foreground"
            style={{ fontFamily: 'var(--font-nunito)' }}>
            No members yet.
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] px-5 py-4 flex items-center gap-4"
            >
              {/* Avatar */}
              <div
                className="h-10 w-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ background: getAvatarColor(member.name), fontFamily: 'var(--font-fredoka)' }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold text-foreground truncate"
                    style={{ fontFamily: 'var(--font-fredoka)' }}
                  >
                    {member.name}
                  </span>
                  {member.pin_reset === 1 && (
                    <span
                      className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700"
                      style={{ fontFamily: 'var(--font-nunito)' }}
                    >
                      PIN reset
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  <span>Joined {formatDate(member.created_at)}</span>
                  <span>·</span>
                  <span>{member.sessionCount} session{member.sessionCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <MemberActions member={member} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
