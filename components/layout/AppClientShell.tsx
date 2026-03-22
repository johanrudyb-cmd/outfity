'use client';

import { Suspense } from 'react';
import { Providers } from '@/components/providers/Providers';
import { SurplusModalProvider } from '@/components/usage/SurplusModalContext';
import { GlobalEnhancements } from '@/components/layout/GlobalEnhancements';

export function AppClientShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <SurplusModalProvider>{children}</SurplusModalProvider>
      <Suspense fallback={null}>
        <GlobalEnhancements />
      </Suspense>
    </Providers>
  );
}
