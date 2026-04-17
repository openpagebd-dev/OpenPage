import type {Metadata} from 'next';
import './globals.css';
import { Inter, Hind_Siliguri, JetBrains_Mono } from 'next/font/google';

import { FirebaseProvider } from '@/components/firebase-provider';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const hindSiliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali', 'latin'],
  variable: '--font-bangla',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'OpenPage | Vanguard News Network',
  description: 'High-velocity community response and news platform.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${hindSiliguri.variable} ${mono.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <ErrorBoundary>
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
