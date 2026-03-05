'use client';

import { useActionState, useState } from 'react';
import { joinClub, type JoinState } from '@/lib/actions/join';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PinPad } from '@/components/auth/PinPad';

interface JoinFormProps {
  clubName: string;
}

export function JoinForm({ clubName }: JoinFormProps) {
  const [state, action, pending] = useActionState(joinClub, null);
  const [pinStep, setPinStep] = useState<'pin' | 'confirm'>('pin');
  const [pinValue, setPinValue] = useState('');

  const isExistingUser = state !== null && 'needsPin' in state;
  const isNewUser = state !== null && 'newUser' in state;
  const isStep2 = isExistingUser || isNewUser;
  const lockedName = isStep2 ? (state as { name: string }).name : '';

  const heading = isExistingUser ? 'Welcome back' : isNewUser ? 'Create your PIN' : 'Who are you?';
  const subtext = isExistingUser
    ? `Good to see you, ${lockedName}`
    : isNewUser
    ? pinStep === 'pin' ? 'Choose a 4–6 digit PIN' : 'Confirm your PIN'
    : 'Enter your name to get started';

  const buttonLabel = pending
    ? 'Just a moment…'
    : isExistingUser
    ? 'Sign in'
    : isNewUser
    ? 'Create account'
    : 'Continue';

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
        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-7 space-y-4 stagger">

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

          {/* PIN */}
          {isExistingUser && (
            <PinPad name="pin" label="PIN" autoFocus />
          )}

          {/* New user: sequential PIN steps */}
          {isNewUser && pinStep === 'pin' && (
            <PinPad
              name="pin"
              label="New PIN"
              autoFocus
              onComplete={(val) => { setPinValue(val); setPinStep('confirm'); }}
            />
          )}
          {isNewUser && pinStep === 'confirm' && (
            <>
              <input type="hidden" name="pin" value={pinValue} />
              <PinPad name="confirmPin" label="Confirm PIN" autoFocus />
            </>
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

          {isNewUser && pinStep === 'confirm' && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPinStep('pin')}
              className="w-full h-10 rounded-2xl text-sm font-semibold text-muted-foreground"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              ← Back
            </Button>
          )}

          {!(isNewUser && pinStep === 'pin') && (
            <Button
              type="submit"
              disabled={pending}
              className="w-full h-12 rounded-2xl font-semibold text-sm text-white border-0 mt-2
                         bg-[var(--color-primary)] hover:opacity-90 active:opacity-80
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-opacity shadow-sm"
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {buttonLabel}
            </Button>
          )}

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
        </div>
      </form>
    </div>
  );
}
