import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Daily Demotivations',
  description: 'Your daily dose of demotivating quotes on beautiful landscapes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={playfair.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
