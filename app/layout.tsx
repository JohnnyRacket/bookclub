import type { Metadata } from 'next';
import { Geist, Geist_Mono, Cormorant } from 'next/font/google';
import { clubConfig } from '@/lib/config';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const cormorant = Cormorant({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
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
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}
        style={{ '--color-primary': clubConfig.primaryColor } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
