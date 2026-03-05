import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { clubConfig } from '@/lib/config';
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

export const metadata: Metadata = {
  title: clubConfig.name,
  description: `Welcome to ${clubConfig.name}`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${nunito.variable} antialiased`}
        style={{ '--color-primary': clubConfig.primaryColor, '--primary': clubConfig.primaryColor } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
