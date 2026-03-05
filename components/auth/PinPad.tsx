'use client';

import { useState, useRef, useEffect } from 'react';

interface PinPadProps {
  name: string;
  maxLength?: number;
  label?: string;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

export function PinPad({ name, maxLength = 4, label, autoFocus = false, onComplete }: PinPadProps) {
  const [value, setValue] = useState('');
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Keep a stable ref to handlers so the document listener never goes stale
  const append = (digit: string) => {
    setValue(prev => {
      if (prev.length >= maxLength) return prev;
      const next = prev + digit;
      if (next.length === maxLength) {
        setTimeout(() => onCompleteRef.current?.(next), 0);
      }
      return next;
    });
    setFlashKey(digit);
    setTimeout(() => setFlashKey(null), 150);
  };

  const pop = () => {
    setValue(prev => prev.slice(0, -1));
    setFlashKey('⌫');
    setTimeout(() => setFlashKey(null), 150);
  };

  const handlersRef = useRef({ append, pop });
  handlersRef.current = { append, pop };

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus) wrapperRef.current?.focus();
  }, [autoFocus]);

  // Capture keystrokes even when pad isn't focused
  useEffect(() => {
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // If focus is already inside the pad, let onKeyDown on the div handle it
      if (wrapperRef.current?.contains(document.activeElement)) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        wrapperRef.current?.focus();
        handlersRef.current.append(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        wrapperRef.current?.focus();
        handlersRef.current.pop();
      } else if (e.key === 'Enter') {
        wrapperRef.current?.closest('form')?.requestSubmit();
      }
    };
    document.addEventListener('keydown', onDocKeyDown);
    return () => document.removeEventListener('keydown', onDocKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      append(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      pop();
    } else if (e.key === 'Enter') {
      wrapperRef.current?.closest('form')?.requestSubmit();
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', ''];

  return (
    <div>
      {label && (
        <p
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {label}
        </p>
      )}

      {/* Dot indicators */}
      <div className="flex justify-center gap-2.5 mb-5">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-full transition-all duration-150"
            style={{
              background: i < value.length ? 'var(--color-primary)' : 'oklch(0.88 0.01 250)',
              transform: i === value.length - 1 ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <input type="hidden" name={name} value={value} />

      {/* Numpad — tabIndex so it can receive focus and keyboard events */}
      <div
        ref={wrapperRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="outline-none grid grid-cols-3 gap-x-1 gap-y-3"
      >
        {digits.map((digit, i) => {
          if (digit === '') return <div key={i} />;
          const isBackspace = digit === '⌫';
          const isFlashing = flashKey === digit;

          return (
            <button
              key={i}
              type="button"
              onClick={() => isBackspace ? pop() : append(digit)}
              className="h-14 w-14 mx-auto rounded-full text-xl font-semibold select-none transition-all duration-150 active:scale-95"
              style={{
                fontFamily: 'var(--font-fredoka)',
                background: isFlashing
                  ? 'color-mix(in oklch, var(--color-primary) 30%, white)'
                  : isBackspace
                  ? 'oklch(0.94 0.005 250)'
                  : 'oklch(0.96 0.008 250)',
                color: isBackspace ? 'oklch(0.55 0.01 250)' : 'oklch(0.25 0.01 250)',
                transform: isFlashing ? 'scale(0.92)' : '',
              }}
              onMouseEnter={e => {
                if (!isFlashing)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'color-mix(in oklch, var(--color-primary) 14%, white)';
              }}
              onMouseLeave={e => {
                if (!isFlashing)
                  (e.currentTarget as HTMLButtonElement).style.background = isBackspace
                    ? 'oklch(0.94 0.005 250)'
                    : 'oklch(0.96 0.008 250)';
              }}
            >
              {digit}
            </button>
          );
        })}
      </div>
    </div>
  );
}
