import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'Donate Meals (Rethink Food)',
  description: 'Meal donation submission and acknowledgment platform for Rethink Food.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="dm-app">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
