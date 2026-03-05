/**
 * Shared wrapper for all auth pages.
 * Soft primary-tinted background with floating white cards.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{
        background: 'color-mix(in oklch, var(--color-primary) 12%, white)',
      }}
    >
      {children}
    </div>
  );
}
