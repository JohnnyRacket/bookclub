'use client';

import { useTransition, useState } from 'react';
import Link from 'next/link';
import { deleteUserSessions, resetUserPin, type MemberRow } from '@/lib/actions/admin';
import { setCurrentBook, deleteSubmittedBook, type SubmittedBookRow } from '@/lib/actions/admin-books';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [confirmReset, setConfirmReset] = useState(false);

  function handleLogout() {
    startTransition(async () => {
      await deleteUserSessions(member.id);
    });
  }

  function handleResetPin() {
    startTransition(async () => {
      await resetUserPin(member.id);
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isPending || member.sessionCount === 0}
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Sign out
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmReset(true)}
          disabled={isPending}
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Reset PIN
        </Button>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {member.name}&apos;s PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be logged out and must set a new PIN on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPin}>Reset PIN</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatDate(unixSec: number) {
  return new Date(unixSec * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SubmittedBookActions({ book }: { book: SubmittedBookRow }) {
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<'set-current' | 'reject' | null>(null);

  function handleSetCurrent() {
    startTransition(async () => {
      await setCurrentBook(book.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteSubmittedBook(book.id);
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmAction('set-current')}
          disabled={isPending}
          className="text-green-700 border-green-200 hover:bg-green-50"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Set Current
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmAction('reject')}
          disabled={isPending}
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Reject
        </Button>
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={open => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'set-current' ? `Set "${book.title}" as current?` : `Reject "${book.title}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'set-current'
                ? 'This will replace the current book for the club.'
                : 'This will permanently delete this submission.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction === 'set-current' ? handleSetCurrent : handleDelete}
              className={confirmAction === 'reject' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
            >
              {confirmAction === 'set-current' ? 'Set Current' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AdminPanel({ members, submittedBooks }: { members: MemberRow[]; submittedBooks: SubmittedBookRow[] }) {
  return (
    <div className="w-full max-w-xl animate-page-in">
      {/* Header */}
      <div className="mb-6 stagger">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          ← Home
        </Link>
        <div className="text-center">
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
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]" style={{ fontFamily: 'var(--font-nunito)' }}>
                      PIN reset
                    </Badge>
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

      {/* Submitted Books */}
      <div className="mt-10 stagger">
        <div className="mb-4 text-center">
          <h2
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-fredoka)' }}
          >
            Submitted Books
          </h2>
          <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
            {submittedBooks.length} pending submission{submittedBooks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {submittedBooks.length === 0 ? (
            <div
              className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] p-8 text-center text-sm text-muted-foreground"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              No submissions yet.
            </div>
          ) : (
            submittedBooks.map(book => (
              <div
                key={book.id}
                className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] px-5 py-4 flex items-center gap-4"
              >
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                    style={{ background: 'color-mix(in oklch, var(--color-primary) 12%, white)' }}
                  >
                    📖
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold text-foreground truncate"
                    style={{ fontFamily: 'var(--font-fredoka)' }}
                  >
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
                    {book.author}
                    {book.submitter_name && <span className="ml-2">· by {book.submitter_name}</span>}
                    <span className="ml-2">· {formatDate(book.created_at)}</span>
                  </p>
                </div>
                <SubmittedBookActions book={book} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
