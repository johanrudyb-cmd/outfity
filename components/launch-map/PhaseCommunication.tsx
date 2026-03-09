'use client';

import { useState } from 'react';
import { BaseAgentChat } from './BaseAgentChat';
import type { BrandIdentity } from './LaunchMapStepper';
import { Sparkles, Megaphone, ArrowRight, PlayCircle, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Helper component for message content
const MessageContent = ({ content }: { content: string }) => {
    return <div className="whitespace-pre-wrap">{content}</div>;
};

interface PhaseCommunicationProps {
    brandId: string;
    brand?: BrandIdentity | null;
    onComplete: () => void;
    userPlan?: string;
}

export function PhaseCommunication({ brandId, brand, onComplete, userPlan = 'free' }: PhaseCommunicationProps) {
    const renderMessageContent = (content: string, isUser: boolean) => {
        return <MessageContent content={content} />;
    };

    const customViews = (
        <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mb-4 ml-1">Actions Rapides</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    {
                        label: '🚀 Script Teaser',
                        icon: PlayCircle,
                        prompt: "Joy, fais-moi un script de teaser mystère pour mon nouveau drop. Je veux créer de la hype sans tout montrer."
                    },
                    {
                        label: '📖 Storytime',
                        icon: BookOpen,
                        prompt: "Joy, je veux raconter l'histoire de ma marque dans une vidéo. Aide-moi à écrire un script émotionnel."
                    },
                    {
                        label: '🧵 Behind the Scenes',
                        icon: Layers,
                        prompt: "Joy, comment montrer les détails de fabrication et la qualité de mes vêtements de manière stylée ?"
                    }
                ].map((action) => (
                    <Button
                        key={action.label}
                        variant="outline"
                        onClick={() => {
                            const event = new CustomEvent('agent-chat-input', { detail: action.prompt });
                            window.dispatchEvent(event);
                        }}
                        className="h-auto py-5 px-4 rounded-[24px] border-black/[0.06] hover:border-[#ff327e]/40 hover:bg-[#ff327e]/5 flex flex-col items-center text-center gap-3 group transition-all shadow-sm bg-white/50 backdrop-blur-sm"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-[#ff327e]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <action.icon className="w-5 h-5 text-[#ff327e]" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-bold text-[#1D1D1F] block">{action.label}</span>
                            <span className="text-[10px] text-[#86868B] font-medium leading-tight block opacity-60">Générer en 1 clic</span>
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    );

    return (
        <BaseAgentChat
            brandId={brandId}
            userPlan={userPlan}
            agentName="Joy"
            agentRole="Experte Création de Contenu"
            agentImage="/images/agents/joy_final.webp"
            themeColor="bg-[#ff327e]"
            themeHoverColor="hover:bg-[#e62c6e]"
            themeTextColor="text-[#ff327e]"
            themeGradient="from-[#ff327e] to-[#cc2460]"
            agentIcon={Megaphone}
            apiEndpoint="/api/launch-map/communication-chat"
            storageKey="joy_communication"
            welcomeTitle="Tes Scripts Viraux"
            welcomeDescription={<>Je suis <b>Joy</b>. Maintenant que ton design est validé, on va préparer le terrain. Je vais te donner des scripts TikTok exacts pour faire buzzer ton produit. Prêt ?</>}
            welcomePrompts={[
                "J'ai besoin d'un script pour teaser ma marque",
                "Comment montrer le design de manière virale ?",
                "Je n'ai pas d'idée de vidéo..."
            ]}
            welcomeIcons={
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-40">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Viralité TikTok</span>
                    </div>
                </div>
            }
            renderMessageContent={renderMessageContent}
            onComplete={onComplete}
            upgradeLinkText="Débloquer Joy Pro"
            backHref="/launch-map"
            customViews={customViews}
        />
    );
}
