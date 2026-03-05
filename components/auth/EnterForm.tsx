'use client';

import { useActionState } from 'react';
import { enterClub } from '@/lib/actions/enter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface EnterFormProps {
  clubName: string;
  logoUrl?: string | null;
}

export function EnterForm({ clubName, logoUrl }: EnterFormProps) {
  const [state, action, pending] = useActionState(enterClub, null);

  return (
    <div className="w-full max-w-sm animate-page-in">
      {/* Logo + Club Name */}
      <div className="mb-10 text-center stagger">
        {logoUrl && (
          <div className="mb-5 flex justify-center">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl ring-1 ring-[oklch(0.88_0.018_75)]">
              <Image src={logoUrl} alt={clubName} fill className="object-contain" />
            </div>
          </div>
        )}
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
          <span
            className="text-xs tracking-[0.25em] uppercase"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-geist-sans)' }}
          >
            Welcome
          </span>
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
        </div>
        <h1
          className="text-4xl font-light leading-tight tracking-wide text-foreground/90 mt-3"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          {clubName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the club password to continue
        </p>
      </div>

      {/* Form */}
      <form action={action} className="stagger">
        <div className="rounded-3xl bg-card border border-border shadow-[0_2px_20px_oklch(0.18_0.018_65/0.06)] p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Club password"
              autoComplete="current-password"
              autoFocus
              required
              className="rounded-2xl border-border bg-background h-11 px-4 text-sm
                         placeholder:text-muted-foreground/50
                         focus-visible:ring-1 focus-visible:ring-offset-0
                         focus-visible:ring-[var(--color-primary)]/40
                         focus-visible:border-[var(--color-primary)]/40
                         transition-colors"
            />
          </div>

          {state && 'error' in state && (
            <p className="text-sm text-destructive text-center -mt-2">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-11 rounded-2xl font-medium text-sm transition-all
                       bg-[var(--color-primary)] hover:opacity-90 text-white
                       disabled:opacity-50"
          >
            {pending ? 'Checking…' : 'Enter'}
          </Button>
        </div>
      </form>

      {/* Decorative footer mark */}
      <p className="mt-8 text-center text-xs text-muted-foreground/40 tracking-widest select-none">
        ✦
      </p>
    </div>
  );
}
