'use client';

import { useTransition, useState } from 'react';
import { reactBook } from '@/lib/actions/books';
import { EmojiPicker } from './EmojiPicker';

interface BookReact {
  emoji: string;
  count: number;
  userReacted: boolean;
  users: string[];
}

interface BookReactsProps {
  bookId: number;
  reacts: BookReact[];
  locked: boolean;
  reactPresets?: string[];
}

const MAX_SHOWN = 3;

export function BookReacts({ bookId, reacts, locked, reactPresets }: BookReactsProps) {
  const [isPending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeReacts = reacts.filter(r => r.count > 0);
  if (activeReacts.length === 0 && locked) return null;

  function handleReact(emoji: string) {
    if (locked) return;
    startTransition(async () => {
      await reactBook(bookId, emoji);
    });
  }

  return (
    <div className="flex flex-wrap gap-5 pt-1 items-start">
      {activeReacts.map(({ emoji, userReacted, users }) => {
        const shown = users.slice(0, MAX_SHOWN);
        const hidden = users.length - MAX_SHOWN;

        return (
          <div key={emoji} className="flex flex-col items-center gap-1 min-w-[2.5rem]">
            <button
              onClick={() => handleReact(emoji)}
              disabled={isPending || locked}
              className={`leading-none select-none transition-all duration-150 disabled:cursor-default
                ${locked
                  ? 'text-[1.75rem]'
                  : 'text-[1.75rem] hover:scale-125 hover:-translate-y-0.5 active:scale-95'
                }
                ${userReacted ? 'scale-110' : ''}`}
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>

            <div className="flex flex-col items-center gap-0.5">
              {shown.map((name, i) => (
                <span
                  key={name}
                  className={`text-[11px] leading-tight text-center max-w-[5rem] truncate
                    ${i === 0 && userReacted
                      ? 'font-bold text-foreground'
                      : 'text-muted-foreground'
                    }`}
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  {name}
                </span>
              ))}
              {hidden > 0 && (
                <span
                  className="text-[10px] text-muted-foreground/70 font-medium"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  +{hidden} more
                </span>
              )}
            </div>
          </div>
        );
      })}

      {!locked && (
        <div className="flex flex-col items-center gap-1 min-w-[2.5rem]">
          <EmojiPicker
            presets={reactPresets ?? []}
            onSelect={handleReact}
            open={pickerOpen}
            onOpenChange={setPickerOpen}
          >
            <button
              disabled={isPending}
              className="w-[2.1rem] h-[2.1rem] rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-90 disabled:opacity-50"
              aria-label="Add reaction"
              title="Add reaction"
            >
              <span className="text-gray-500 text-xl font-black leading-none select-none">+</span>
            </button>
          </EmojiPicker>
        </div>
      )}
    </div>
  );
}
