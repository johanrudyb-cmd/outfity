'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Share, PlusSquare, Smartphone, MoreVertical, Download, Bell, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebPush } from '@/lib/hooks/useWebPush';

export function InstallAppBanner() {
    const [isStandalone, setIsStandalone] = useState(true); // default true to avoid hydration mismatch
    const [showModal, setShowModal] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

    useEffect(() => {
        // Check if already installed
        const isMatchMedia = window.matchMedia('(display-mode: standalone)').matches;
        const isNavigatorStandalone = (window.navigator as any).standalone === true;
        setIsStandalone(isMatchMedia || isNavigatorStandalone);

        // Detect platform
        const ua = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(ua)) {
            setPlatform('ios');
        } else if (/android/.test(ua)) {
            setPlatform('android');
        }
    }, []);

    const { isSupported, isSubscribed, subscribe, loading: pushLoading, testPush } = useWebPush();

    // Don't show the install banner if the app is already installed,
    // INSTEAD show a "enable notifications" banner if supported and not subscribed
    if (isStandalone) {
        if (!isSupported || isSubscribed) return null;

        return (
            <div className="bg-gradient-to-r from-[#007AFF]/10 to-[#5AC8FA]/10 rounded-2xl p-4 border border-[#007AFF]/20 flex items-center justify-between gap-3 mt-4 mx-4 mb-2 shadow-sm animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#007AFF]/20 flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-[#007AFF]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-[#1D1D1F] leading-tight truncate">Activer les Notifications</p>
                        <p className="text-[10px] text-[#86868B] font-medium mt-0.5 truncate">Sois prévenu des tendances</p>
                    </div>
                </div>
                <Button
                    onClick={async () => {
                        const success = await subscribe();
                        if (success) {
                            testPush();
                        }
                    }}
                    disabled={pushLoading}
                    className="h-8 rounded-full px-3 text-xs font-bold bg-[#007AFF] hover:bg-[#0056CC] text-white shadow-sm shrink-0"
                >
                    {pushLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Autoriser'}
                </Button>
            </div>
        );
    }

    return (
        <>
            {/* The Banner */}
            <div className="bg-gradient-to-r from-[#007AFF]/10 to-[#5AC8FA]/10 rounded-2xl p-4 border border-[#007AFF]/20 flex items-center justify-between gap-3 mt-4 mx-4 mb-2 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 shadow-md">
                        <Image src="/apple-icon.png" alt="OUTFITY App" width={40} height={40} className="object-cover rounded-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-[#1D1D1F] leading-tight truncate">L'App OUTFITY</p>
                        <p className="text-[10px] text-[#86868B] font-medium mt-0.5 truncate">Notifs Push Incluses</p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="h-8 rounded-full px-3 text-xs font-bold bg-[#007AFF] hover:bg-[#0056CC] text-white shadow-sm shrink-0"
                >
                    Obtenir
                </Button>
            </div>

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
                                    <Image src="/apple-icon.png" alt="OUTFITY App" width={80} height={80} className="object-cover rounded-3xl" />
                                </div>
                                <h2 className="text-2xl font-black text-[#1D1D1F]">Installer OUTFITY</h2>
                                <p className="text-sm text-[#86868B] mt-2 font-medium">
                                    Installez l'application sur votre écran d'accueil pour profiter du mode plein écran et des notifications push.
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
                                                2. Faites défiler et choisissez <strong className="font-bold">Sur l'écran d'accueil</strong>
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
                                                2. Sélectionnez <strong className="font-bold">Installer l'application</strong> ou <strong className="font-bold">Ajouter à l'écran d'accueil</strong>
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
                                                Sur Chrome / Edge, cliquez sur l'icône <strong className="font-bold">Installer</strong> dans la barre de recherche en haut à droite.
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
                                    J'ai compris
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
