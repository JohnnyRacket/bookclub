'use client';

import { useActionState, useEffect, useRef } from 'react';
import { joinClub, type JoinState } from '@/lib/actions/join';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JoinFormProps {
  clubName: string;
}

export function JoinForm({ clubName }: JoinFormProps) {
  const [state, action, pending] = useActionState(joinClub, null);
  const pinRef = useRef<HTMLInputElement>(null);

  const isExistingUser = state !== null && 'needsPin' in state;
  const isNewUser = state !== null && 'newUser' in state;
  const isStep2 = isExistingUser || isNewUser;
  const lockedName = isStep2 ? (state as { name: string }).name : '';

  useEffect(() => {
    if (isStep2) pinRef.current?.focus();
  }, [isStep2]);

  const heading = isExistingUser ? 'Welcome back' : isNewUser ? 'Set your PIN' : 'Join the club';
  const subtext = isExistingUser
    ? `Enter your PIN to sign in as ${lockedName}`
    : isNewUser
    ? 'Choose a 4–6 digit PIN to secure your account'
    : 'Enter your name to get started';

  const buttonLabel = pending
    ? 'Just a moment…'
    : isExistingUser
    ? 'Sign in'
    : isNewUser
    ? 'Create account'
    : 'Continue';

  return (
    <div className="w-full max-w-sm animate-page-in">
      {/* Header */}
      <div className="mb-10 text-center stagger">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
          <span
            className="text-xs tracking-[0.25em] uppercase"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-geist-sans)' }}
          >
            {clubName}
          </span>
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
        </div>
        <h1
          className="text-4xl font-light leading-tight tracking-wide text-foreground/90 mt-3"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          {heading}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtext}</p>
      </div>

      <form action={action} className="stagger">
        <div className="rounded-3xl bg-card border border-border shadow-[0_2px_20px_oklch(0.18_0.018_65/0.06)] p-8 space-y-5">

          {/* Step 1: name input / Step 2: locked name chip */}
          {isStep2 ? (
            <>
              <input type="hidden" name="name" value={lockedName} />
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted border border-border">
                <span className="text-xs text-muted-foreground">Signing in as</span>
                <span className="text-sm font-medium text-foreground">{lockedName}</span>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                Your name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Display name"
                autoComplete="nickname"
                autoFocus
                required
                className="rounded-2xl border-border bg-background h-11 px-4 text-sm
                           placeholder:text-muted-foreground/50
                           focus-visible:ring-1 focus-visible:ring-offset-0
                           focus-visible:ring-[var(--color-primary)]/40
                           focus-visible:border-[var(--color-primary)]/40"
              />
            </div>
          )}

          {/* PIN — shown in step 2 only */}
          {isStep2 && (
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium text-foreground/80">
                PIN
              </Label>
              <Input
                ref={pinRef}
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4,6}"
                maxLength={6}
                placeholder="••••"
                autoComplete={isNewUser ? 'new-password' : 'current-password'}
                required
                className="rounded-2xl border-border bg-background h-11 px-4 text-sm tracking-[0.5em]
                           placeholder:tracking-[0.2em]
                           focus-visible:ring-1 focus-visible:ring-offset-0
                           focus-visible:ring-[var(--color-primary)]/40
                           focus-visible:border-[var(--color-primary)]/40"
              />
            </div>
          )}

          {/* Confirm PIN — new users only */}
          {isNewUser && (
            <div className="space-y-2">
              <Label htmlFor="confirmPin" className="text-sm font-medium text-foreground/80">
                Confirm PIN
              </Label>
              <Input
                id="confirmPin"
                name="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="\d{4,6}"
                maxLength={6}
                placeholder="••••"
                autoComplete="new-password"
                required
                className="rounded-2xl border-border bg-background h-11 px-4 text-sm tracking-[0.5em]
                           placeholder:tracking-[0.2em]
                           focus-visible:ring-1 focus-visible:ring-offset-0
                           focus-visible:ring-[var(--color-primary)]/40
                           focus-visible:border-[var(--color-primary)]/40"
              />
            </div>
          )}

          {/* Error */}
          {state && 'error' in state && (
            <div className="rounded-2xl bg-destructive/8 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive text-center">
                {(state as { error: string }).error}
              </p>
              {'attemptsLeft' in state &&
                typeof (state as { attemptsLeft?: number }).attemptsLeft === 'number' && (
                  <p className="text-xs text-destructive/70 text-center mt-1">
                    {(state as { attemptsLeft: number }).attemptsLeft} attempt
                    {(state as { attemptsLeft: number }).attemptsLeft !== 1 ? 's' : ''} remaining
                  </p>
                )}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-11 rounded-2xl font-medium text-sm transition-all
                       bg-[var(--color-primary)] hover:opacity-90 text-white
                       disabled:opacity-50"
          >
            {buttonLabel}
          </Button>

          {isStep2 && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Not {lockedName}? Go back
            </button>
          )}
        </div>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground/40 tracking-widest select-none">
        ✦
      </p>
    </div>
  );
}
