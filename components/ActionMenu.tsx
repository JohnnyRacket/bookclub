'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { startVotingSession, startRandomSelection } from '@/lib/actions/book-selection';
import { AdminPinModal } from '@/components/auth/AdminPinModal';

export function ActionMenu({
  atSubmissionCap,
  submissionCount,
  selectionMode,
  openSessionId,
  isAdmin,
  submittedBookCount,
  isPinless,
}: {
  atSubmissionCap: boolean;
  submissionCount: number;
  selectionMode: 'admin' | 'vote' | 'random';
  openSessionId: number | null;
  isAdmin: boolean;
  submittedBookCount: number;
  isPinless: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  async function doStartVote() {
    const res = await startVotingSession();
    if (res.error) {
      setVoteError(res.error);
    } else if (res.sessionId) {
      router.push(`/select-book/vote/${res.sessionId}`);
    }
  }

  function handleStartVote() {
    setOpen(false);
    if (isAdmin) {
      startTransition(doStartVote);
    } else {
      setPinModalOpen(true);
    }
  }

  function handleRandomPick() {
    setOpen(false);
    startTransition(async () => {
      const res = await startRandomSelection();
      if (res.redirect) {
        router.push(res.redirect);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer"
            style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
          >
            {isPending ? '…' : '+ Do Something'}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-52 p-1.5 rounded-xl border-0"
          style={{ background: 'var(--color-primary)' }}
        >
          {!atSubmissionCap && (
            <button
              onClick={() => go('/submit')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20 cursor-pointer"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Submit Book
            </button>
          )}
          {submissionCount > 0 && (
            <button
              onClick={() => go('/my-submissions')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20 cursor-pointer"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              My Submissions
            </button>
          )}

          {selectionMode === 'vote' && openSessionId !== null && (
            <button
              onClick={() => go(`/select-book/vote/${openSessionId}`)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20 cursor-pointer"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Join Next Book Vote
            </button>
          )}

          {selectionMode === 'vote' && openSessionId === null && (
            <button
              onClick={handleStartVote}
              disabled={isPending || submittedBookCount === 0}
              title={submittedBookCount === 0 ? 'No books have been submitted yet' : undefined}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Start Book Vote
            </button>
          )}

          {selectionMode === 'random' && isAdmin && (
            <button
              onClick={handleRandomPick}
              disabled={isPending}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 cursor-pointer"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Pick Random Book
            </button>
          )}

          <button
            onClick={() => go('/add-reaction')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20 cursor-pointer"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Add Custom Reaction
          </button>
          <div className="my-1 border-t border-white/30" />
          <button
            onClick={() => go('/admin')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Elevate to Admin
          </button>
        </PopoverContent>
      </Popover>

      <AdminPinModal
        open={pinModalOpen}
        pinless={isPinless}
        title="Start Book Vote"
        onClose={() => setPinModalOpen(false)}
        onSuccess={doStartVote}
      />
    </>
  );
}
