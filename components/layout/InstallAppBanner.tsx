'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { X, Share, PlusSquare, Smartphone, MoreVertical, Download, Bell, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebPush } from '@/lib/hooks/useWebPush';

export function InstallAppBanner() {
    const pathname = usePathname();
    const [showModal, setShowModal] = useState(false);
    const isClient = typeof window !== 'undefined';
    const isStandalone = isClient
        ? window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
        : true;
    const platform: 'ios' | 'android' | 'desktop' = isClient
        ? (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
            ? 'ios'
            : (/android/.test(navigator.userAgent.toLowerCase()) ? 'android' : 'desktop'))
        : 'desktop';

    const { isSupported, isSubscribed, subscribe, loading: pushLoading, testPush } = useWebPush();

    // Only display on Dashboard home page
    if (pathname !== '/dashboard') return null;

    // Don't show the install banner if the app is already installed,
    // INSTEAD show a "enable notifications" banner if supported and not subscribed
    if (isStandalone) {
        if (!isSupported || isSubscribed) return null;

        return (
            <button
                onClick={async () => {
                    const success = await subscribe();
                    if (success) {
                        testPush();
                    }
                }}
                disabled={pushLoading}
                className="flex items-center gap-2 h-8 lg:h-9 px-3 lg:px-4 rounded-full bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] hover:opacity-90 text-white shadow-sm transition-opacity duration-200 border-none shrink-0 cursor-pointer animate-in fade-in zoom-in"
            >
                {pushLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Bell className="w-3.5 h-3.5" />
                )}
                <span className="text-[11px] lg:text-xs font-bold whitespace-nowrap hidden sm:inline-block">Activer Notifs</span>
            </button>
        );
    }

    return (
        <>
            {/* The Compact Banner Button for Header */}
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 h-8 lg:h-9 px-3 lg:px-4 rounded-full bg-[#1D1D1F] hover:bg-black text-white shadow-sm transition-colors duration-200 border-none shrink-0 cursor-pointer"
            >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px] lg:text-xs font-bold whitespace-nowrap hidden sm:inline-block">TÃ©lÃ©charger l&apos;App</span>
            </button>

            {/* The Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-br from-[#007AFF]/5 to-transparent p-6 text-center relative border-b border-black/5">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-[#86868B] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="w-20 h-20 rounded-3xl bg-black flex items-center justify-center mx-auto shadow-xl mb-4 border border-black/10">
                                    <Image src="/apple-icon.webp" alt="OUTFITY App" width={80} height={80} className="object-cover rounded-3xl" />
                                </div>
                                <h2 className="text-2xl font-black text-[#1D1D1F]">Installer OUTFITY</h2>
                                <p className="text-sm text-[#86868B] mt-2 font-medium">
                                    Installez l&apos;application sur votre Ã©cran d&apos;accueil pour profiter du mode plein Ã©cran et des notifications push.
                                </p>
                            </div>

                            {/* Instructions */}
                            <div className="p-6 space-y-5 bg-[#FAFAFA]">
                                {platform === 'ios' && (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-white shadow-sm border border-black/5 flex items-center justify-center text-[#007AFF]">
                                                <Share className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium text-[#1D1D1F]">
                                                1. Appuyez sur le bouton <strong className="font-bold">Partager</strong> dans la barre de navigation Safari
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-white shadow-sm border border-black/5 flex items-center justify-center text-[#1D1D1F]">
                                                <PlusSquare className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium text-[#1D1D1F]">
                                                2. Faites dÃ©filer et choisissez <strong className="font-bold">Sur l&apos;Ã©cran d&apos;accueil</strong>
                                            </p>
                                        </div>
                                    </>
                                )}

                                {platform === 'android' && (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-white shadow-sm border border-black/5 flex items-center justify-center text-[#1D1D1F]">
                                                <MoreVertical className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium text-[#1D1D1F]">
                                                1. Appuyez sur le <strong className="font-bold">Menu (3 points)</strong>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-white shadow-sm border border-black/5 flex items-center justify-center text-[#007AFF]">
                                                <Download className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium text-[#1D1D1F]">
                                                2. SÃ©lectionnez <strong className="font-bold">Installer l&apos;application</strong> ou <strong className="font-bold">Ajouter Ã  l&apos;Ã©cran d&apos;accueil</strong>
                                            </p>
                                        </div>
                                    </>
                                )}

                                {platform === 'desktop' && (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-white shadow-sm border border-black/5 flex items-center justify-center text-[#007AFF]">
                                                <Download className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium text-[#1D1D1F]">
                                                Sur Chrome / Edge, cliquez sur l&apos;icÃ´ne <strong className="font-bold">Installer</strong> dans la barre de recherche en haut Ã  droite.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="p-4 bg-white border-t border-black/5">
                                <Button
                                    onClick={() => setShowModal(false)}
                                    className="w-full h-12 rounded-xl text-base font-bold bg-black text-white hover:bg-[#1D1D1F]"
                                >
                                    J&apos;ai compris
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

