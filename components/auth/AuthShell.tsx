/**
 * Shared wrapper for all auth pages.
 * Provides the warm paper background and centered layout.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.93 0.025 var(--hue, 75) / 0.5) 0%, transparent 70%),
          oklch(0.975 0.012 75)
        `,
      }}
    >
      {children}
    </div>
  );
}
