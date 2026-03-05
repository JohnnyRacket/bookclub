import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { getClubConfig } from '@/lib/actions/settings';
import './globals.css';

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getClubConfig();
  return {
    title: config.name,
    description: `Welcome to ${config.name}`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = await getClubConfig();
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${nunito.variable} antialiased`}
        style={{
          '--color-primary': config.primaryColor,
          '--primary': config.primaryColor,
          '--shadow-card': `0 14px 48px oklch(from ${config.primaryColor} l c h / 0.18)`,
          '--shadow-card-sm': `0 6px 24px oklch(from ${config.primaryColor} l c h / 0.14)`,
          '--shadow-float': `0 20px 56px oklch(from ${config.primaryColor} l c h / 0.24)`,
          '--shadow-picker': `0 12px 36px oklch(from ${config.primaryColor} l c h / 0.24)`,
        } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
