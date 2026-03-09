'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/toast';
import { SWRConfig } from 'swr';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ToastProvider>
                <SWRConfig
                    value={{
                        revalidateOnFocus: false,
                        shouldRetryOnError: false,
                        keepPreviousData: true,
                        dedupingInterval: 1000 * 60 * 5, // 5 minutes
                        fetcher: (resource, init) => fetch(resource, init).then(res => res.json())
                    }}
                >
                    {children}
                </SWRConfig>
            </ToastProvider>
        </SessionProvider>
    );
}
