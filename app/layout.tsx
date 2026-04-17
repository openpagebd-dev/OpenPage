import type {Metadata} from 'next';
import './globals.css'; // Global styles

import { FirebaseProvider } from '@/components/firebase-provider';
import { ErrorBoundary } from '@/components/error-boundary';

export const metadata: Metadata = {
  title: 'OpenPage | Immersive Real-Time News',
  description: 'High-velocity community response and news platform.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
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
