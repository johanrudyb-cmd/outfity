'use client';

import { useState, useEffect } from 'react';
import { X, Share, PlusSquare, ArrowBigDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function IOSInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Vérifier si c'est iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        // Vérifier si l'app est déjà en mode standalone (déjà "installée")
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        // Vérifier si l'utilisateur a déjà fermé le prompt (via localStorage)
        const hasSeenPrompt = localStorage.getItem('ios_install_prompt_hidden') === 'true';

        if (isIOS && !isStandalone && !hasSeenPrompt) {
            setShowPrompt(true);
        }
    }, []);

    const handleClose = () => {
        setShowPrompt(false);
        localStorage.setItem('ios_install_prompt_hidden', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white rounded-3xl shadow-2xl border border-black/5 p-5 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />

                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex gap-4">
                    <div className="shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shadow-lg overflow-hidden border border-black/10">
                            <Image src="/apple-icon.webp" alt="OUTFITY" width={56} height={56} className="object-cover" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-1 pr-6">
                        <h3 className="font-bold text-[#1D1D1F]">Installer OUTFITY</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Ajoutez l'app sur votre écran d'accueil pour un accès rapide et une expérience plein écran.
                        </p>
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t border-black/5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#007AFF]">
                            <Share className="w-4 h-4" />
                        </div>
                        <p className="text-[13px] text-[#1D1D1F]">
                            1. Appuyez sur le bouton <strong>Partager</strong>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                            <PlusSquare className="w-4 h-4" />
                        </div>
                        <p className="text-[13px] text-[#1D1D1F]">
                            2. Sélectionnez <strong>Sur l&apos;écran d&apos;accueil</strong>
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex justify-center">
                    <div className="animate-bounce text-primary">
                        <ArrowBigDown className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}
