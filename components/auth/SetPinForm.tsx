'use client';

import { useActionState } from 'react';
import { setPin } from '@/lib/actions/set-pin';
import { Button } from '@/components/ui/button';
import { PinPad } from '@/components/auth/PinPad';

export function SetPinForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(setPin, null);

  return (
    <div className="w-full max-w-xs animate-page-in">
      <div className="mb-6 text-center stagger">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          Action required
        </p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          New PIN required
        </h1>
        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-nunito)' }}>
          Hi {name}, please choose a new PIN
        </p>
      </div>

      <form action={action}>
        <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-7 space-y-4 stagger">
          <PinPad name="pin" label="New PIN" autoFocus />
          <PinPad name="confirmPin" label="Confirm PIN" />

          {state && 'error' in state && (
            <div className="rounded-2xl bg-destructive/8 border border-destructive/15 px-4 py-3">
              <p className="text-sm text-destructive text-center font-semibold" style={{ fontFamily: 'var(--font-nunito)' }}>
                {(state as { error: string }).error}
              </p>
            </div>
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
            {pending ? 'Saving…' : 'Set new PIN'}
          </Button>
        </div>
      </form>
    </div>
  );
}
