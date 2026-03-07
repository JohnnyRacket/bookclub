'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { startVotingSession, startRandomSelection } from '@/lib/actions/book-selection';
import { AdminPinModal } from '@/components/auth/AdminPinModal';

const GAME_TYPES = [
  { value: 'wheel', icon: '🎡', label: 'Spinning Wheel', desc: 'Classic wheel of fortune' },
  { value: 'horse_race', icon: '🏇', label: 'Horse Race', desc: 'Books race to the finish' },
  { value: 'battle', icon: '⚔️', label: 'Battle Royale', desc: '1v1 bracket elimination' },
] as const;

type GameType = 'wheel' | 'horse_race' | 'battle';

function GamePickerModal({
  open,
  onClose,
  onPick,
  isPending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: GameType) => void;
  isPending: boolean;
  error: string | null;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-page-in"
        style={{ background: 'white', fontFamily: 'var(--font-nunito)' }}
      >
        <h2 className="text-xl font-bold mb-1 text-center" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--color-primary)' }}>
          Choose the Game
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-5" style={{ fontFamily: 'var(--font-nunito)' }}>
          How should we pick the next book?
        </p>
        <div className="space-y-2">
          {GAME_TYPES.map(({ value, icon, label, desc }) => (
            <button
              key={value}
              onClick={() => onPick(value)}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{ borderColor: 'color-mix(in oklch, var(--color-primary) 30%, transparent)', background: 'color-mix(in oklch, var(--color-primary) 6%, white)' }}
            >
              <span className="text-3xl flex-shrink-0">{icon}</span>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-fredoka)' }}>{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
        {error && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            {error}
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

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
  const [randomPinModalOpen, setRandomPinModalOpen] = useState(false);
  const [gamePickerOpen, setGamePickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [voteError, setVoteError] = useState<string | null>(null);
  const [randomError, setRandomError] = useState<string | null>(null);
  const router = useRouter();

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  async function doStartVote() {
    setVoteError(null);
    const res = await startVotingSession();
    if (res.error) {
      setVoteError(res.error);
      return res.error;
    } else if (res.sessionId) {
      setOpen(false);
      router.push(`/select-book/vote/${res.sessionId}`);
    }
  }

  function handleStartVote() {
    setVoteError(null);
    if (isAdmin) {
      startTransition(doStartVote);
    } else {
      setOpen(false);
      setPinModalOpen(true);
    }
  }

  function handleRandomPick() {
    setRandomError(null);
    setOpen(false);
    if (isAdmin) {
      setGamePickerOpen(true);
    } else {
      setRandomPinModalOpen(true);
    }
  }

  function doRandomPick(gameType: GameType) {
    setRandomError(null);
    startTransition(async () => {
      const res = await startRandomSelection(gameType);
      if (res.error) {
        setRandomError(res.error);
      } else if (res.redirect) {
        setGamePickerOpen(false);
        router.push(res.redirect);
      } else {
        setGamePickerOpen(false);
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

          {selectionMode === 'random' && (
            <button
              onClick={handleRandomPick}
              disabled={isPending || submittedBookCount === 0}
              title={submittedBookCount === 0 ? 'No books have been submitted yet' : undefined}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Pick Random Book
            </button>
          )}

          {voteError && (
            <div className="mx-1 mt-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700" style={{ fontFamily: 'var(--font-nunito)' }}>
              {voteError}
            </div>
          )}
          {randomError && (
            <div className="mx-1 mt-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700" style={{ fontFamily: 'var(--font-nunito)' }}>
              {randomError}
            </div>
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
            Book Club Settings
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

      <AdminPinModal
        open={randomPinModalOpen}
        pinless={isPinless}
        title="Pick Random Book"
        onClose={() => setRandomPinModalOpen(false)}
        onSuccess={() => { setGamePickerOpen(true); }}
      />

      <GamePickerModal
        open={gamePickerOpen}
        onClose={() => setGamePickerOpen(false)}
        onPick={doRandomPick}
        isPending={isPending}
        error={randomError}
      />
    </>
  );
}
