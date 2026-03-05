'use client';

import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { CustomReaction } from '@/lib/actions/reactions';

interface ReactionPickerProps {
  emojis: string[];
  customReactions?: CustomReaction[];
  onSelect: (emoji: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function ReactionPicker({ emojis, customReactions, onSelect, open, onOpenChange, children }: ReactionPickerProps) {
  function pick(emoji: string) {
    onSelect(emoji);
    onOpenChange(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-64 rounded-2xl shadow-[var(--shadow-picker)] border border-gray-100 p-3 max-h-72 flex flex-col"
        align="start"
        side="top"
      >
        <div className="overflow-y-auto flex flex-col gap-2 min-h-0">
          {/* Custom reactions section — always shown */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 px-0.5">Custom</p>
            <div className="grid grid-cols-7 gap-0.5">
              {customReactions && customReactions.map(r => (
                <button
                  key={r.id}
                  onClick={() => pick(r.image_path)}
                  title={r.label ?? undefined}
                  className="hover:scale-110 active:scale-90 transition-transform duration-100 p-1 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                  aria-label={r.label ?? 'Custom reaction'}
                >
                  <img src={r.image_path} alt={r.label ?? 'custom'} className="w-6 h-6 object-contain" />
                </button>
              ))}
              <Link
                href="/add-reaction"
                className="p-1 rounded-lg hover:bg-gray-100 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Add custom reaction"
                aria-label="Add custom reaction"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs font-bold leading-none">+</span>
              </Link>
            </div>
          </div>

          {emojis.length > 0 && (
            <>
              <hr className="border-gray-100" />

              {/* Emoji grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => pick(emoji)}
                    className="text-[1.25rem] leading-none hover:scale-110 active:scale-90 transition-transform duration-100 select-none p-1 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                    aria-label={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
