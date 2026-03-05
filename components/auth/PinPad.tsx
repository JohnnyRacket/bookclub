'use client';

import { useState, useRef, useEffect } from 'react';

interface PinPadProps {
  name: string;
  maxLength?: number;
  label?: string;
  autoFocus?: boolean;
}

export function PinPad({ name, maxLength = 4, label, autoFocus = false }: PinPadProps) {
  const [value, setValue] = useState('');
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) wrapperRef.current?.focus();
  }, [autoFocus]);

  const flash = (key: string) => {
    setFlashKey(key);
    setTimeout(() => setFlashKey(null), 150);
  };

  const append = (digit: string) => {
    setValue(prev => prev.length < maxLength ? prev + digit : prev);
    flash(digit);
  };

  const pop = () => {
    setValue(prev => prev.slice(0, -1));
    flash('⌫');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      append(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      pop();
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', ''];

  return (
    <div className="space-y-3">
      {label && (
        <p
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {label}
        </p>
      )}

      {/* Dot indicators */}
      <div className="flex justify-center gap-2.5">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-full transition-all duration-150"
            style={{
              background: i < value.length
                ? 'var(--color-primary)'
                : 'oklch(0.88 0.01 250)',
              transform: i === value.length - 1 ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />

      {/* Numpad */}
      <div
        ref={wrapperRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="outline-none grid grid-cols-3 gap-2"
      >
        {digits.map((digit, i) => {
          if (digit === '') return <div key={i} />;

          const isBackspace = digit === '⌫';

          return (
            <button
              key={i}
              type="button"
              onClick={() => isBackspace ? pop() : append(digit)}
              className="h-14 w-14 mx-auto rounded-full text-xl font-semibold select-none transition-all duration-150 active:scale-95"
              style={{
                fontFamily: 'var(--font-fredoka)',
                background: flashKey === digit
                  ? 'color-mix(in oklch, var(--color-primary) 30%, white)'
                  : isBackspace
                  ? 'oklch(0.94 0.005 250)'
                  : 'oklch(0.96 0.008 250)',
                color: isBackspace ? 'oklch(0.55 0.01 250)' : 'oklch(0.25 0.01 250)',
                transform: flashKey === digit ? 'scale(0.92)' : '',
              }}
              onMouseEnter={e => {
                if (flashKey !== digit)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'color-mix(in oklch, var(--color-primary) 14%, white)';
              }}
              onMouseLeave={e => {
                if (flashKey !== digit)
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
