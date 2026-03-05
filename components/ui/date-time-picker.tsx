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

export function DateTimePicker({ name, defaultValue, className }: DateTimePickerProps) {
  // Parse defaultValue into date + time parts
  const parsed = React.useMemo(() => {
    if (!defaultValue) return null;
    const d = parse(defaultValue, "yyyy-MM-dd'T'HH:mm", new Date());
    return isValid(d) ? d : null;
  }, [defaultValue]);

  const [date, setDate] = React.useState<Date | undefined>(parsed ?? undefined);
  const [hours, setHours] = React.useState<number>(parsed ? parsed.getHours() : 18);
  const [minutes, setMinutes] = React.useState<number>(parsed ? parsed.getMinutes() : 0);
  const [open, setOpen] = React.useState(false);

  const hiddenValue = date ? toDatetimeLocal(date, hours, minutes) : '';

  const displayLabel = date
    ? `${format(date, 'MMM d, yyyy')} at ${pad(hours)}:${pad(minutes)}`
    : 'Pick a date & time';

  function handleHourChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0));
    setHours(v);
  }

  function handleMinuteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0));
    setMinutes(v);
  }

  function handleHourKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') { e.preventDefault(); setHours(h => Math.min(23, h + 1)); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHours(h => Math.max(0, h - 1)); }
  }

  function handleMinuteKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') { e.preventDefault(); setMinutes(m => Math.min(59, m + 1)); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setMinutes(m => Math.max(0, m - 1)); }
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
                type="number"
                min={0}
                max={23}
                value={pad(hours)}
                onChange={handleHourChange}
                onKeyDown={handleHourKey}
                className="w-10 text-center text-sm font-medium rounded-lg border border-gray-200 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Hours"
              />
              <span className="text-muted-foreground font-semibold">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={pad(minutes)}
                onChange={handleMinuteChange}
                onKeyDown={handleMinuteKey}
                className="w-10 text-center text-sm font-medium rounded-lg border border-gray-200 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Minutes"
              />
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
