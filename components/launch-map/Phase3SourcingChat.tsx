'use client';

import { useState } from 'react';
import { ExternalLink, Check, ArrowRight, Loader2, Sparkles, Factory, Globe } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BrandIdentity } from './LaunchMapStepper';
import { BaseAgentChat } from './BaseAgentChat';

interface Phase3SourcingChatProps {
    brandId: string;
    brand?: BrandIdentity | null;
    onComplete?: () => void;
    userPlan?: string;
}

// Renders message content — handles [Button](/link) and __SEND_QUOTE:[id]__ tokens
function SourcingMessageContent({
    content,
    isUser,
    brandId,
    onQuoteSent,
}: {
    content: string;
    isUser: boolean;
    brandId: string;
    onQuoteSent?: (factoryId: string) => void;
}) {
    const [sentQuotes, setSentQuotes] = useState<Record<string, boolean>>({});
    const [sending, setSending] = useState<Record<string, boolean>>({});

    const quoteMatches = [...content.matchAll(/__SEND_QUOTE:([\w-]+)__/g)];
    const factoryIds = quoteMatches.map(m => m[1]);
    const cleanedContent = content.replace(/__SEND_QUOTE:[\w-]+__/g, '').trim();

    const handleSendQuote = async (factoryId: string) => {
        setSending(prev => ({ ...prev, [factoryId]: true }));
        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandId, factoryId, status: 'sent' }),
            });
            if (res.ok) {
                setSentQuotes(prev => ({ ...prev, [factoryId]: true }));
                onQuoteSent?.(factoryId);
            }
        } catch (e) {
            console.error('Erreur envoi devis:', e);
        } finally {
            setSending(prev => ({ ...prev, [factoryId]: false }));
        }
    };

    const parts = cleanedContent.split(/(\[.*?\]\(.*?\))/g);
    const elements = parts.map((part, i) => {
        const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (match) {
            const [, label, url] = match;
            return (
                <Link
                    key={i}
                    href={url}
                    target={url.startsWith('http') ? '_blank' : undefined}
                    rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={cn(
                        "inline-flex items-center gap-1.5 mt-3 mb-1 font-bold text-[13px] px-4 py-2.5 rounded-2xl transition-all no-underline shadow-sm",
                        isUser ? "bg-white text-amber-600" : "bg-[#007AFF] text-white hover:bg-[#0056CC]"
                    )}
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {label}
                </Link>
            );
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
    });

    return (
        <div className="leading-relaxed text-[15px]">
            {elements}
            {!isUser && factoryIds.map(factoryId => (
                <button
                    key={factoryId}
                    onClick={() => handleSendQuote(factoryId)}
                    disabled={!!sentQuotes[factoryId] || !!sending[factoryId]}
                    className={cn(
                        "inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all shadow-sm mr-2 active:scale-95 flex-wrap",
                        sentQuotes[factoryId]
                            ? "bg-emerald-500 text-white cursor-default"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                    )}
                >
                    {sending[factoryId]
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : sentQuotes[factoryId]
                            ? <Check className="w-3.5 h-3.5" />
                            : <ArrowRight className="w-3.5 h-3.5" />
                    }
                    {sentQuotes[factoryId] ? 'Demande envoyée ✓' : 'Contacter cette usine'}
                </button>
            ))}
        </div>
    );
}

export function Phase3SourcingChat({ brandId, brand, onComplete, userPlan = 'free' }: Phase3SourcingChatProps) {
    const renderMessageContent = (content: string, isUser: boolean) => (
        <SourcingMessageContent content={content} isUser={isUser} brandId={brandId} />
    );

    return (
        <BaseAgentChat
            brandId={brandId}
            userPlan={userPlan}
            agentName="Ada"
            agentRole="Sourcing"
            agentImage="/images/agents/ada_final.png"
            themeColor="bg-[#007AFF]"
            themeHoverColor="hover:bg-[#0056CC]"
            themeTextColor="text-[#007AFF]"
            apiEndpoint="/api/launch-map/sourcing-chat"
            storageKey="ada"
            welcomeTitle="Trouvez l'usine parfaite"
            welcomeDescription={<>Je suis <b>Ada</b>, votre experte en production. Je parcours notre base d'usines mondiales certifiées pour trouver le partenaire idéal selon vos besoins, quantités et budget.</>}
            welcomePrompts={[
                "Je cherche un fabricant de t-shirts streetwear en coton lourd (Portugal)",
                "Je veux produire des ensembles jogging (Turquie, MOQ bas)",
                "Quelles sont les usines spécialisées en broderie / impression 3D ?",
                "Quelle est la différence de coût entre l'Europe et l'Asie pour des hoodies ?"
            ]}
            welcomeIcons={
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-40">
                    <div className="flex items-center gap-2"><Factory className="w-5 h-5" /><span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Usines Vérifiées</span></div>
                    <div className="flex items-center gap-2"><Globe className="w-5 h-5" /><span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Europe & Asie</span></div>
                </div>
            }
            renderMessageContent={renderMessageContent}
            onComplete={onComplete}
            allowImageUpload={true}
            upgradeLinkText="Débloquer Sourcing Pro"
        />
    );
}
