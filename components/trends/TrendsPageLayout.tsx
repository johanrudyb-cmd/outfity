'use client';

import { TendancesContent } from '@/components/trends/TendancesContent';
import { motion } from 'framer-motion';

interface TrendsPageLayoutProps {
    initialData: unknown;
}

export function TrendsPageLayout({ initialData }: TrendsPageLayoutProps) {
    return (
        <div className="w-full min-h-screen bg-[#F5F5F7]">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full"
            >
                <TendancesContent initialData={initialData} />
            </motion.div>
        </div>
    );
}
