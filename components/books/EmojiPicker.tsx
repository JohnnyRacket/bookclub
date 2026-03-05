'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EXTENDED_EMOJIS = [
  '⭐', '💯', '📚', '🎉', '😍', '🤯', '💀', '🙈',
  '👀', '💫', '🌟', '🎭', '🥱', '😬', '🫡', '🫠',
  '🤌', '💅', '🧠', '🫶', '🤡', '😤', '🥲', '🫂',
  '🙃', '😮‍💨', '🫣', '😏', '🤩', '💔', '🫰', '😵',
  '🤓', '🥸', '😇', '🤗', '😑', '🫥',
];

interface EmojiPickerProps {
  presets: string[];
  onSelect: (emoji: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function EmojiPicker({ presets, onSelect, open, onOpenChange, children }: EmojiPickerProps) {
  function pick(emoji: string) {
    onSelect(emoji);
    onOpenChange(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-64 rounded-2xl shadow-[var(--shadow-picker)] border border-gray-100 p-3"
        align="start"
        side="top"
      >
        {/* Presets row */}
        <div className="flex gap-1 justify-around mb-2">
          {presets.map(emoji => (
            <button
              key={emoji}
              onClick={() => pick(emoji)}
              className="text-[1.6rem] leading-none hover:scale-125 active:scale-90 transition-transform duration-100 select-none p-1 rounded-xl hover:bg-gray-100 cursor-pointer"
              aria-label={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <hr className="border-gray-100 mb-2" />

        {/* Extended scrollable grid */}
        <div className="grid grid-cols-7 gap-0.5 max-h-40 overflow-y-auto">
          {EXTENDED_EMOJIS.map(emoji => (
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
      </PopoverContent>
    </Popover>
  );
}
