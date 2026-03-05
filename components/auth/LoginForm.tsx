'use client';

import { useActionState } from 'react';
import { loginUser, type LoginState } from '@/lib/actions/login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PinPad } from '@/components/auth/PinPad';

interface LoginFormProps {
  clubName: string;
  initialName?: string;
}

export function LoginForm({ clubName, initialName }: LoginFormProps) {
  const [state, action, pending] = useActionState(
    loginUser,
    initialName ? { needsPin: true, name: initialName } : null,
  );

  const isStep2 = state !== null && 'needsPin' in state;
  const lockedName = isStep2 ? (state as { name: string }).name : '';

  const heading = isStep2 ? 'Welcome back' : 'Sign in';
  const subtext = isStep2
    ? `Good to see you, ${lockedName}`
    : 'Enter your name to continue';

  return (
    <div className="w-full max-w-xs animate-page-in">
      {/* Above-card header */}
      <div className="mb-6 text-center stagger">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          {clubName}
        </p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          {heading}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          {subtext}
        </p>
      </div>

      <form action={action}>
        <div className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-7 space-y-4 stagger">

          {/* Step 1: name / Step 2: name pill */}
          {isStep2 ? (
            <>
              <input type="hidden" name="name" value={lockedName} />
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[oklch(0.97_0.008_250)]">
                <div
                  className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'var(--color-primary)', fontFamily: 'var(--font-fredoka)' }}
                >
                  {lockedName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground leading-none mb-0.5" style={{ fontFamily: 'var(--font-nunito)' }}>
                    Signing in as
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-none" style={{ fontFamily: 'var(--font-fredoka)' }}>
                    {lockedName}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-nunito)' }}
              >
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
                className="rounded-2xl bg-[oklch(0.97_0.008_250)] border-transparent h-12 px-4 text-sm
                           placeholder:text-muted-foreground/40
                           focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30
                           focus-visible:border-transparent focus-visible:ring-offset-0"
                style={{ fontFamily: 'var(--font-nunito)' }}
              />
            </div>
          )}

          {/* Step 2: PIN */}
          {isStep2 && (
            <PinPad name="pin" label="PIN" autoFocus />
          )}

          {/* Error */}
          {state && 'error' in state && (
            <div className="rounded-2xl bg-destructive/8 border border-destructive/15 px-4 py-3">
              <p className="text-sm text-destructive text-center font-semibold" style={{ fontFamily: 'var(--font-nunito)' }}>
                {(state as { error: string }).error}
              </p>
              {'attemptsLeft' in state &&
                typeof (state as { attemptsLeft?: number }).attemptsLeft === 'number' && (
                  <p className="text-xs text-destructive/70 text-center mt-1" style={{ fontFamily: 'var(--font-nunito)' }}>
                    {(state as { attemptsLeft: number }).attemptsLeft} attempt
                    {(state as { attemptsLeft: number }).attemptsLeft !== 1 ? 's' : ''} remaining
                  </p>
                )}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-2xl font-semibold text-sm text-white border-0 mt-2
                       bg-[var(--color-primary)] hover:opacity-90 active:opacity-80
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-opacity shadow-sm"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            {pending ? 'Just a moment…' : isStep2 ? 'Sign in' : 'Continue'}
          </Button>

          {isStep2 && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              Not {lockedName}? Go back
            </button>
          )}

          {!isStep2 && (
            <p className="text-center text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
              New here?{' '}
              <a href="/join" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Register →
              </a>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
