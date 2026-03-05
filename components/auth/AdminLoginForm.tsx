'use client';

import { useActionState } from 'react';
import { verifyAdmin } from '@/lib/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(verifyAdmin, null);

  return (
    <div className="w-full max-w-sm animate-page-in">
      <div className="mb-10 text-center stagger">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
          <span
            className="text-xs tracking-[0.25em] uppercase"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-geist-sans)' }}
          >
            Restricted
          </span>
          <span className="block h-px flex-1 bg-[oklch(0.88_0.018_75)]" />
        </div>
        <h1
          className="text-4xl font-light leading-tight tracking-wide text-foreground/90 mt-3"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Admin access
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the admin PIN to continue
        </p>
      </div>

      <form action={action} className="stagger">
        <div className="rounded-3xl bg-card border border-border shadow-[0_2px_20px_oklch(0.18_0.018_65/0.06)] p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-sm font-medium text-foreground/80">
              Admin PIN
            </Label>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="••••"
              autoFocus
              required
              className="rounded-2xl border-border bg-background h-11 px-4 text-sm tracking-[0.5em]
                         placeholder:tracking-[0.2em]
                         focus-visible:ring-1 focus-visible:ring-offset-0
                         focus-visible:ring-[var(--color-primary)]/40
                         focus-visible:border-[var(--color-primary)]/40"
            />
          </div>

          {state && 'error' in state && (
            <div className="rounded-2xl bg-destructive/8 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive text-center">
                {(state as { error: string }).error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-11 rounded-2xl font-medium text-sm transition-all
                       bg-[var(--color-primary)] hover:opacity-90 text-white
                       disabled:opacity-50"
          >
            {pending ? 'Verifying…' : 'Access admin'}
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground/40 tracking-widest select-none">
        ✦
      </p>
    </div>
  );
}
