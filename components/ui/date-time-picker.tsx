'use client';

import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, ClockIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateTimePickerProps {
  name: string;
  defaultValue?: string; // datetime-local format: "YYYY-MM-DDTHH:mm"
  className?: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDatetimeLocal(date: Date, hours: number, minutes: number): string {
  return `${format(date, 'yyyy-MM-dd')}T${pad(hours)}:${pad(minutes)}`;
}

// Convert 24h hours to 12h display value (1–12)
function to12h(h: number): number {
  const v = h % 12;
  return v === 0 ? 12 : v;
}

export function DateTimePicker({ name, defaultValue, className }: DateTimePickerProps) {
  const parsed = React.useMemo(() => {
    if (!defaultValue) return null;
    const d = parse(defaultValue, "yyyy-MM-dd'T'HH:mm", new Date());
    return isValid(d) ? d : null;
  }, [defaultValue]);

  const [date, setDate] = React.useState<Date | undefined>(parsed ?? undefined);
  const [hours, setHours] = React.useState<number>(parsed ? parsed.getHours() : 18); // 24h internally
  const [minutes, setMinutes] = React.useState<number>(parsed ? parsed.getMinutes() : 0);
  const [open, setOpen] = React.useState(false);

  // Local string state so the user can freely backspace and retype
  const [hourInput, setHourInput] = React.useState<string>(pad(to12h(parsed ? parsed.getHours() : 18)));
  const [minuteInput, setMinuteInput] = React.useState<string>(pad(parsed ? parsed.getMinutes() : 0));

  const ampm = hours < 12 ? 'AM' : 'PM';
  const display12h = to12h(hours);

  const hiddenValue = date ? toDatetimeLocal(date, hours, minutes) : '';

  const displayLabel = date
    ? `${format(date, 'MMM d, yyyy')} at ${display12h}:${pad(minutes)} ${ampm}`
    : 'Pick a date & time';

  function commitHour(raw: string) {
    let v = parseInt(raw, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 12) v = 12;
    const newHours = ampm === 'AM' ? (v % 12) : (v % 12) + 12;
    setHours(newHours);
    setHourInput(pad(v));
  }

  function handleHourChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    setHourInput(raw);
    // Auto-commit if we have a valid complete value
    const v = parseInt(raw, 10);
    if (!isNaN(v) && v >= 1 && v <= 12) {
      const newHours = ampm === 'AM' ? (v % 12) : (v % 12) + 12;
      setHours(newHours);
    }
  }

  function handleHourBlur() {
    commitHour(hourInput);
  }

  function handleHourKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHours(h => {
        const next12 = (to12h(h) % 12) + 1;
        const newH = ampm === 'AM' ? next12 % 12 : (next12 % 12) + 12;
        setHourInput(pad(to12h(newH)));
        return newH;
      });
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHours(h => {
        const prev12 = ((to12h(h) - 2 + 12) % 12) + 1;
        const newH = ampm === 'AM' ? prev12 % 12 : (prev12 % 12) + 12;
        setHourInput(pad(to12h(newH)));
        return newH;
      });
    }
  }

  function commitMinute(raw: string) {
    let v = parseInt(raw, 10);
    if (isNaN(v) || v < 0) v = 0;
    if (v > 59) v = 59;
    setMinutes(v);
    setMinuteInput(pad(v));
  }

  function handleMinuteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMinuteInput(raw);
    const v = parseInt(raw, 10);
    if (!isNaN(v) && v >= 0 && v <= 59) {
      setMinutes(v);
    }
  }

  function handleMinuteBlur() {
    commitMinute(minuteInput);
  }

  function handleMinuteKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMinutes(m => { const next = Math.min(59, m + 1); setMinuteInput(pad(next)); return next; });
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMinutes(m => { const next = Math.max(0, m - 1); setMinuteInput(pad(next)); return next; });
    }
  }

  function toggleAmPm() {
    setHours(h => h < 12 ? h + 12 : h - 12);
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <input type="hidden" name={name} value={hiddenValue} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal rounded-xl border-gray-200 px-3 py-2.5 h-auto text-sm',
              !date && 'text-muted-foreground'
            )}
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { setDate(d); }}
            initialFocus
          />
          {/* Time picker */}
          <div className="border-t px-4 py-3 flex items-center gap-3">
            <ClockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1" style={{ fontFamily: 'var(--font-nunito)' }}>
              <input
                type="text"
                inputMode="numeric"
                value={hourInput}
                onChange={handleHourChange}
                onBlur={handleHourBlur}
                onKeyDown={handleHourKey}
                onFocus={e => e.target.select()}
                className="w-10 text-center text-sm font-medium rounded-lg border border-gray-200 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Hours"
                placeholder="12"
              />
              <span className="text-muted-foreground font-semibold">:</span>
              <input
                type="text"
                inputMode="numeric"
                value={minuteInput}
                onChange={handleMinuteChange}
                onBlur={handleMinuteBlur}
                onKeyDown={handleMinuteKey}
                onFocus={e => e.target.select()}
                className="w-10 text-center text-sm font-medium rounded-lg border border-gray-200 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Minutes"
                placeholder="00"
              />
              <button
                type="button"
                onClick={toggleAmPm}
                className="ml-1 px-2 py-1 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Toggle AM/PM"
              >
                {ampm}
              </button>
            </div>
            <Button
              size="sm"
              className="ml-auto rounded-lg text-xs"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
