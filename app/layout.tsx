import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Daily Demotivations | Funny Demotivational Quotes',
    template: '%s | Daily Demotivations',
  },
  description: 'A fresh demotivational quote paired with a stunning landscape photo, updated every day. Start your day with a healthy dose of humbling wisdom.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Daily Demotivations',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@dailydemotivate', // Placeholder - update when Twitter account exists
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={playfair.variable}>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
