'use client';

import { Bot, LayoutList, ArrowRight } from 'lucide-react';
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
        return (
            <div className="leading-relaxed text-[15px] prose prose-sm max-w-none">
                <ReactMarkdown
                    components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-[14px]">{children}</li>,
                        a: ({ href, children }) => (
                            <Link
                                href={href || '#'}
                                className={cn(
                                    "inline-flex items-center gap-2 mt-2 mb-1 font-bold text-[13px] px-4 py-2 rounded-2xl transition-all no-underline shadow-sm",
                                    isUser ? "bg-white text-[#AF52DE]" : "bg-[#AF52DE] text-white hover:bg-[#AF52DE]/90"
                                )}
                            >
                                {children}<ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        ),
                        code: ({ children }) => <code className="bg-black/5 rounded px-1 py-0.5 text-[13px] font-mono">{children}</code>,
                    }}
                >
                    {content}
                </ReactMarkdown>
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
                agentImage="/images/agents/joy_final.webp"
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
