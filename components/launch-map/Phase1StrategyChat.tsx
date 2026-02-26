'use client';

import { ArrowRight, Pencil, Target, PenTool, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { BrandIdentity } from './LaunchMapStepper';
import { BaseAgentChat } from './BaseAgentChat';
import { getBrandLogoUrl } from '@/lib/curated-brands';
import { BrandLogo } from '@/components/brands/BrandLogo';

interface Phase1StrategyChatProps {
    brandId: string;
    brand?: BrandIdentity | null;
    onComplete: () => void;
    userPlan?: string;
    onShowClassic?: () => void;
    inspirationBrandName?: string | null;  // nom de la marque d'inspiration
    inspirationBrandSlug?: string | null;  // slug pour le logo
    changesRemaining?: number;             // combien de changements restants ce mois
}

export function Phase1StrategyChat({ brandId, brand, onComplete, userPlan = 'free', onShowClassic, inspirationBrandName, inspirationBrandSlug, changesRemaining = 3 }: Phase1StrategyChatProps) {
    const renderMessageContent = (content: string, isUser: boolean) => {
        const parts = content.split(/(\[.*?\]\(.*?\))/g);
        return (
            <div className="leading-relaxed text-[15px]">
                {parts.map((part, i) => {
                    const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
                    if (match) {
                        const [, label, url] = match;
                        if (url === '/launch-map/phase/1') {
                            return (
                                <button
                                    key={i}
                                    onClick={onShowClassic}
                                    className={cn(
                                        "inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all shadow-sm",
                                        isUser ? "bg-white text-[#007AFF]" : "bg-[#007AFF] text-white hover:bg-[#0056CC]"
                                    )}
                                >
                                    {label}<ArrowRight className="w-4 h-4" />
                                </button>
                            );
                        }
                        return (
                            <Link key={i} href={url}
                                className={cn("inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all no-underline shadow-sm",
                                    isUser ? "bg-white text-[#007AFF]" : "bg-[#007AFF] text-white hover:bg-[#0056CC]"
                                )}>
                                {label}<ArrowRight className="w-4 h-4" />
                            </Link>
                        );
                    }
                    return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
                })}
            </div>
        );
    };

    const headerActions = (
        <div className="flex items-center gap-2">
            {/* Bouton Modifier (pour changer la marque d'inspiration) */}
            {onShowClassic && (
                <Button
                    onClick={onShowClassic}
                    variant="ghost"
                    className="h-8 sm:h-9 text-[10px] sm:text-xs font-bold rounded-xl gap-1.5 px-2.5 sm:px-4 bg-black/[0.03] hover:bg-black/[0.06] transition-apple"
                    title={changesRemaining === 0 ? 'Limite de 3 changements/mois atteinte' : `Modifier (${changesRemaining} restant${changesRemaining > 1 ? 's' : ''})`}
                >
                    <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">
                        Modifier {changesRemaining < 3 && <span className="text-[9px] opacity-60 ml-1">({changesRemaining}/3)</span>}
                    </span>
                </Button>
            )}
        </div>
    );

    // Bandeau d'inspiration à afficher dans le chat
    const inspirationBanner = inspirationBrandName ? (
        <div className="mx-3 sm:mx-6 mt-3 mb-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-black/5 shadow-sm flex items-center justify-center p-1.5 shrink-0">
                <BrandLogo brandName={inspirationBrandName} logoUrl={getBrandLogoUrl(inspirationBrandName)} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Marque d'inspiration</p>
                <p className="text-sm font-bold text-[#1D1D1F] leading-tight truncate">{inspirationBrandName}</p>
            </div>
            {changesRemaining < 3 && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {changesRemaining} modif. restante{changesRemaining > 1 ? 's' : ''}
                </span>
            )}
        </div>
    ) : null;

    return (
        <BaseAgentChat
            brandId={brandId}
            userPlan={userPlan}
            agentName="Virgil"
            agentRole="Stratégie"
            agentImage="/images/agents/virgil_final.png"
            themeColor="bg-[#007AFF]"
            themeHoverColor="hover:bg-[#0056CC]"
            themeTextColor="text-[#007AFF]"
            apiEndpoint="/api/launch-map/strategy-chat"
            storageKey="virgil-chat"
            welcomeTitle="Affinez votre stratégie"
            welcomeDescription={<>Je suis <b>Virgil</b>, ton expert stratégie. Je suis là pour t'aider à définir ton positionnement, créer ton ADN de marque et concevoir un plan d'action qui marche.</>}
            welcomePrompts={[
                "Explique-moi ma stratégie",
                "Comment l'appliquer concrètement ?",
                "Par quoi dois-je commencer ?",
                "Peux-tu me donner des exemples de marques similaires ?"
            ]}
            welcomeIcons={
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-40">
                    <div className="flex items-center gap-2"><Target className="w-5 h-5" /><span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Positionnement</span></div>
                    <div className="flex items-center gap-2"><PenTool className="w-5 h-5" /><span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">ADN de marque</span></div>
                </div>
            }
            renderMessageContent={renderMessageContent}
            headerActions={headerActions}
            onComplete={onComplete}
            upgradeLinkText="Débloquer Mon Atelier"
            customViews={inspirationBanner}
            processBotReply={(rawContent) => {
                const suggestMatch = rawContent.match(/\[\[(.*?)\]\]/);
                const newSuggestions = suggestMatch ? suggestMatch[1].split('|') : [];
                const cleanedContent = rawContent.replace(/\[\[.*?\]\]/g, '').trim();
                return { cleanedContent, newSuggestions };
            }}
        />
    );
}
