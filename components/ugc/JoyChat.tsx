'use client';

import { Sparkles, MessageCircle, Calendar as CalendarIcon, Bot, User, LayoutList, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { BaseAgentChat } from '@/components/launch-map/BaseAgentChat';

interface JoyChatProps {
    brandId: string;
    brandName: string;
    initialImageUrl?: string;
    userPlan?: string;
    onBack?: () => void;
}

export function JoyChat({ brandId, brandName, initialImageUrl, userPlan = 'free', onBack }: JoyChatProps) {
    const renderMessageContent = (content: string, isUser: boolean) => {
        const parts = content.split(/(\[.*?\]\(.*?\))/g);
        return (
            <div className="leading-relaxed text-[15px]">
                {parts.map((part, i) => {
                    const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
                    if (match) {
                        const [, label, url] = match;
                        return (
                            <Link key={i} href={url}
                                className={cn("inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all no-underline shadow-sm",
                                    isUser ? "bg-white text-[#AF52DE]" : "bg-[#AF52DE] text-white hover:bg-[#AF52DE]/90"
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

    return (
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <BaseAgentChat
                brandId={brandId}
                userPlan={userPlan}
                onBack={onBack}
                containerClassName="bg-[#F5F5F7]"
                agentName="Joy"
                agentRole="DA & RÉSEAUX SOCIAUX"
                agentImage="/images/agents/joy_final.png"
                themeColor="bg-[#AF52DE]"
                themeHoverColor="hover:bg-[#AF52DE]/90"
                themeTextColor="text-[#AF52DE]"
                apiEndpoint="/api/chat/joy"
                storageKey="joy"
                welcomeTitle="Rendez votre marque virale"
                welcomeDescription={<>Je suis <b>Joy</b>, ta directrice artistique. Je suis là pour transformer {brandName} en une machine à contenu viral sur TikTok et Instagram.</>}
                welcomePrompts={[
                    "Génère-moi 3 Hooks TikTok",
                    "Idée de Reel virale pour dimanche",
                    "Quel est le ton de notre marque ?",
                    "Écris la légende de ce post Insta"
                ]}
                welcomeIcons={
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-40">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Hooks Viraux</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <LayoutList className="w-5 h-5" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Scripts Reels</span>
                        </div>
                    </div>
                }
                renderMessageContent={renderMessageContent}
                customViews={initialImageUrl ? (
                    <div className="mx-3 sm:mx-6 mt-3 mb-1 px-4 py-3 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-black/10 shadow-sm flex items-center justify-center">
                            <img src={initialImageUrl} alt="Context" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#AF52DE]">Produit en vedette</p>
                            <p className="text-sm font-bold text-[#1D1D1F] leading-tight truncate">Photo contextuelle prête</p>
                        </div>
                    </div>
                ) : null}
                maxFreeMessages={10}
                onComplete={() => onBack?.()}
            />
        </div>
    );
}
