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
    <div className="w-full max-w-xs animate-page-in">
      {/* Above-card header */}
      <div className="mb-6 stagger">
        {logoUrl ? (
          <div className="mb-4 flex justify-center">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-sm">
              <Image src={logoUrl} alt={clubName} fill className="object-contain" />
            </div>
          </div>
        ) : (
          <div
            className="mb-4 mx-auto h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm"
            style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-fredoka)' }}
          >
            {clubName.charAt(0).toUpperCase()}
          </div>
        )}
        <h1
          className="text-3xl font-semibold text-foreground text-center"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          {clubName}
        </h1>
        <p
          className="mt-1 text-sm text-muted-foreground text-center"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Enter the password to continue
        </p>
      </div>

      {/* Floating card */}
      <form action={action}>
        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-7 space-y-4 stagger">
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
              autoFocus
              required
              className="rounded-2xl bg-[oklch(0.97_0.008_250)] border-transparent h-12 px-4 text-sm
                         placeholder:text-muted-foreground/40
                         focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30
                         focus-visible:border-transparent focus-visible:ring-offset-0
                         transition-shadow"
              style={{ fontFamily: 'var(--font-nunito)' }}
            />
          </div>

          {state && 'error' in state && (
            <p
              className="text-sm text-destructive text-center font-semibold"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-2xl font-semibold text-sm text-white border-0
                       bg-[var(--color-primary)] hover:opacity-90 active:opacity-80
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-opacity shadow-sm"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            {pending ? 'Checking…' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}
