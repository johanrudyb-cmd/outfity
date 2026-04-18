'use client';

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Send, ArrowLeft, Loader2, Paperclip, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { isFreePlan } from '@/lib/plan-utils';

export interface BaseMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    imagePreview?: string;
}

export interface BaseAgentChatProps {
    brandId: string;
    userPlan?: string;
    // Agent identity
    agentName: string;
    agentRole: string;
    agentImage: string;
    themeColor: string; // e.g., 'bg-[#007AFF]'
    themeHoverColor: string; // e.g., 'hover:bg-[#0056CC]'
    themeTextColor: string; // e.g., 'text-[#007AFF]'
    themeGradient?: string; // e.g., 'from-[#95BF47] to-[#5E8E3E]'
    agentIcon?: React.ElementType<{ className?: string }>; // e.g., Store

    // API
    apiEndpoint: string;
    storageKey: string;

    // Welcome Screen
    welcomeTitle: ReactNode;
    welcomeDescription: ReactNode;
    welcomePrompts: string[];
    welcomeIcons: ReactNode;

    // Limits
    maxFreeMessages?: number;
    upgradeLinkText?: string;

    // Customization
    renderMessageContent: (content: string, isUser: boolean) => ReactNode;
    headerActions?: ReactNode;
    customViews?: ReactNode; // e.g., Shopify connect view
    hideChatWhenCustomView?: boolean;
    onComplete?: () => void;
    canComplete?: boolean;
    allowImageUpload?: boolean;
    onStrategyReady?: (strategyText: string) => void;

    processBotReply?: (rawContent: string) => { cleanedContent: string; newSuggestions: string[] };
    containerClassName?: string;
    onBack?: () => void;
    backHref?: string;
}

export function BaseAgentChat({
    brandId,
    userPlan = 'free',
    agentName,
    agentRole,
    agentImage,
    themeColor,
    themeHoverColor,
    themeTextColor,
    themeGradient,
    agentIcon: AgentIcon,
    apiEndpoint,
    storageKey,
    welcomeTitle,
    welcomeDescription,
    welcomePrompts,
    welcomeIcons,
    maxFreeMessages = 15,
    upgradeLinkText = 'Débloquer Pro',
    renderMessageContent,
    headerActions,
    customViews,
    hideChatWhenCustomView,
    onComplete,
    canComplete = true,
    allowImageUpload,
    onStrategyReady,
    processBotReply,
    containerClassName,
    onBack,
    backHref = '/launch-map'
}: BaseAgentChatProps) {
    const [messages, setMessages] = useState<BaseMessage[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasInitialized = useRef(false);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    const getMaxTextareaHeight = () => (
        typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches ? 88 : 120
    );

    useEffect(() => { scrollToBottom(); }, [messages, isTyping, customViews]);

    // Load from DB + fallback to local storage
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const loadHistory = async () => {
            try {
                // 1. Try DB
                const res = await fetch(`/api/chat/history?brandId=${brandId}&agentKey=${storageKey}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages?.length > 0) {
                        setMessages(data.messages.map((m: any) => ({
                            ...m,
                            timestamp: new Date(m.timestamp)
                        })));
                        return;
                    }
                }

                // 2. Fallback to local storage if DB empty
                const saved = localStorage.getItem(`${storageKey}-${brandId}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setMessages(parsed.map((m: { timestamp: string | Date } & Omit<BaseMessage, 'timestamp'>) => ({
                            ...m,
                            timestamp: new Date(m.timestamp)
                        })));
                    }
                }
            } catch (err) {
                console.warn('Failed to load history:', err);
            }
        };

        loadHistory();
    }, [brandId, storageKey]);

    // Save to local storage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(`${storageKey}-${brandId}`, JSON.stringify(messages));
        }
    }, [messages, brandId, storageKey]);

    const sendMessage = useCallback(async (text: string, imageFile?: File) => {
        if ((!text.trim() && !imageFile) || isTyping) return;

        const imagePreview = imageFile ? URL.createObjectURL(imageFile) : undefined;
        const userMsg: BaseMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text.trim() || '(Fichier envoyé)',
            timestamp: new Date(),
            imagePreview,
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        requestAnimationFrame(() => {
            if (inputRef.current) inputRef.current.style.height = 'auto';
        });
        setSuggestions([]);
        setIsTyping(true);
        setPendingImage(null);

        try {
            let res: Response;
            if (imageFile) {
                const formData = new FormData();
                formData.append('brandId', brandId);
                formData.append('messages', JSON.stringify(updatedMessages.map(m => ({ role: m.role, content: m.content }))));
                formData.append('techPack', imageFile);
                res = await fetch(apiEndpoint, { method: 'POST', body: formData });
            } else {
                res = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        brandId,
                        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                        context: {
                            brandName: storageKey === 'virgil' ? undefined : undefined, // On pourra injecter plus tard
                        }
                    }),
                });
            }

            const data = await res.json();

            if (data.strategyText && data.manifestSaved && onStrategyReady) {
                console.log('[BaseAgentChat] Strategy ready, calling onStrategyReady:', data.strategyText.slice(0, 100));
                onStrategyReady(data.strategyText);
            } else if (data.strategyText) {
                console.log('[BaseAgentChat] Strategy text received but manifestSaved is false:', data.manifestSaved);
            }

            const rawContent = data.reply || data.error || 'Je rencontre un souci technique. Réessaie dans un instant.';

            let finalContent = rawContent;

            if (processBotReply) {
                const { cleanedContent, newSuggestions } = processBotReply(rawContent);
                finalContent = cleanedContent;
                setSuggestions(newSuggestions);
            } else {
                // Default suggestion extraction [[...]]
                const suggestMatch = rawContent.match(/\[\[(.*?)\]\]/);
                if (suggestMatch) {
                    setSuggestions(suggestMatch[1].split('|'));
                    finalContent = rawContent.replace(/\[\[.*?\]\]/g, '').trim();
                } else {
                    setSuggestions([]);
                }
            }

            setMessages(prev => [...prev, {
                id: `agent-${Date.now()}`,
                role: 'assistant',
                content: finalContent,
                timestamp: new Date(),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Oups, problème de connexion. Vérifie ta connexion et réessaie.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsTyping(false);
        }
    }, [messages, brandId, isTyping, apiEndpoint, processBotReply, storageKey]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input, pendingImage?.file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setPendingImage({ file, preview });
        setInput("Voici mon fichier :");
        inputRef.current?.focus();
        e.target.value = '';
    };

    const userMessagesCount = messages.filter(m => m.role === 'user').length;
    const isFreeLimitReached = isFreePlan(userPlan) && userMessagesCount >= maxFreeMessages;

    return (
        <div className={cn("flex flex-col h-full max-h-full w-full bg-[#F5F5F7] font-sans relative overflow-hidden flex-1 min-h-0", containerClassName)}>
            {/* ── Header ── */}
            <div className="bg-white border-b border-black/[0.1] px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                    {onBack ? (
                        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors shrink-0">
                            <ArrowLeft className="w-5 h-5 text-[#86868B]" />
                        </button>
                    ) : (
                        <Link href={backHref} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors shrink-0">
                            <ArrowLeft className="w-5 h-5 text-[#86868B]" />
                        </Link>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                        <div className="relative shrink-0">
                            {AgentIcon && themeGradient ? (
                                <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm text-white", themeGradient)}>
                                    <AgentIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                            ) : (
                                <Image
                                    src={agentImage}
                                    alt={agentName}
                                    width={40}
                                    height={40}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm border border-black/5"
                                />
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-extrabold text-[#1D1D1F] text-[13px] sm:text-[15px] leading-tight truncate">{agentName}</h3>
                            <p className="text-[9px] sm:text-[10px] text-[#86868B] font-bold uppercase tracking-wider leading-none mt-0.5">{agentRole}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {headerActions}
                    {onComplete && (
                        <Button
                            onClick={onComplete}
                            disabled={!canComplete}
                            className={cn(
                                "h-8 sm:h-9 text-[10px] sm:text-xs font-bold rounded-xl gap-1.5 px-3 sm:px-4 text-white shadow-sm transition-apple shrink-0 disabled:opacity-50 disabled:grayscale-[0.5]",
                                themeColor,
                                themeHoverColor
                            )}
                        >
                            <span>{canComplete ? 'Terminer' : 'En attente...'}</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Custom Views ── */}
            {customViews && hideChatWhenCustomView && (
                <div className="flex-1 overflow-y-auto stylish-scrollbar relative z-0 flex flex-col justify-center items-center">
                    {customViews}
                </div>
            )}

            {/* ── Messages Chat UI ── */}
            {(!customViews || !hideChatWhenCustomView) && (
                userMessagesCount === 0 && !isTyping && !pendingImage ? (
                    <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto stylish-scrollbar relative">
                        {/* Ambient background glow */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `radial-gradient(ellipse 60% 40% at 50% 0%, var(--agent-glow, rgba(0,122,255,0.08)) 0%, transparent 70%)`,
                            }}
                        />

                        <div className="relative z-10 flex flex-col items-center w-full px-5 pt-10 pb-6 max-w-2xl mx-auto">
                            {/* Large avatar hero */}
                            <div className="relative mb-6">
                                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl ring-4 ring-white relative">
                                    <Image
                                        src={agentImage}
                                        width={144}
                                        height={144}
                                        className="w-full h-full object-cover"
                                        alt={agentName}
                                    />
                                    {/* Shimmer overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-[inherit]" />
                                </div>
                                {/* Online badge */}
                                <div className="absolute -bottom-1 -right-1 flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-lg border border-black/5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    <span className="text-[10px] font-bold text-[#1D1D1F] whitespace-nowrap">En ligne</span>
                                </div>
                            </div>

                            {/* Agent role tag */}
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-3 shadow-sm",
                                themeColor
                            )}>
                                {agentName}
                            </div>

                            {/* Welcome title */}
                            <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] text-center tracking-tight mb-2 px-2 leading-tight">
                                {welcomeTitle}
                            </h2>
                            <p className="text-center text-[#86868B] text-[13px] sm:text-[15px] max-w-xs mx-auto leading-relaxed mb-8 px-4">
                                {welcomeDescription}
                            </p>

                            {/* Prompt suggestions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mb-6">
                                {welcomePrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(prompt.replace(/ 🧐$/, ''))}
                                        className="group relative text-left p-4 rounded-2xl bg-white border border-black/[0.06] hover:border-black/[0.12] hover:shadow-apple transition-all duration-200 active:scale-[0.97] overflow-hidden"
                                    >
                                        {/* Hover accent */}
                                        <div className={cn(
                                            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl",
                                            `bg-gradient-to-br from-current/[0.03] to-transparent`
                                        )} />
                                        <span className="relative text-[13px] sm:text-[14px] text-[#1D1D1F] font-medium leading-snug">{prompt}</span>
                                        <span className={cn("absolute bottom-3 right-3 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity", themeTextColor)}>
                                            → Envoyer
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {welcomeIcons}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-6 stylish-scrollbar relative z-0 flex flex-col gap-3.5 sm:gap-4 min-h-0">
                        {customViews && !hideChatWhenCustomView && customViews}
                        {messages.map((msg) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div key={msg.id} className={cn("flex items-end gap-1.5 sm:gap-2 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] group", isUser ? 'self-end flex-row-reverse' : 'self-start')}>
                                    {!isUser && (
                                        AgentIcon && themeGradient ? (
                                            <div className={cn("w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center shadow-sm text-white mb-0.5", themeGradient)}>
                                                <AgentIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </div>
                                        ) : (
                                            <Image
                                                src={agentImage}
                                                alt={agentName}
                                                width={28}
                                                height={28}
                                                className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full object-cover shadow-sm border border-black/5 mb-0.5"
                                            />
                                        )
                                    )}
                                    <div
                                        className={cn(
                                            "px-3.5 py-2 sm:px-4 sm:py-3 rounded-[18px] sm:rounded-[24px] text-[14px] sm:text-[15px] leading-relaxed shadow-sm break-words relative transition-apple",
                                            isUser
                                                ? cn(themeColor, "text-white rounded-br-[4px] sm:rounded-br-[8px]")
                                                : "bg-white text-[#1D1D1F] border border-black/[0.05] rounded-bl-[4px] sm:rounded-bl-[8px]"
                                        )}
                                    >
                                        <div className="max-w-none">
                                            {renderMessageContent(msg.content, isUser)}
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-5 text-[10px] text-[#86868B] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                                            isUser ? "right-1" : "left-1"
                                        )}>
                                            {msg.timestamp instanceof Date
                                                ? msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                                : new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {isTyping && (
                            <div className="flex items-end gap-2 self-start max-w-[85%] sm:max-w-[75%]">
                                {AgentIcon && themeGradient ? (
                                    <div className={cn("w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-gradient-to-br flex items-center justify-center shadow-sm text-white mb-0.5", themeGradient)}>
                                        <AgentIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </div>
                                ) : (
                                    <Image
                                        src={agentImage}
                                        alt={agentName}
                                        width={28}
                                        height={28}
                                        className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full object-cover shadow-sm border border-black/5 mb-0.5"
                                    />
                                )}
                                <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-[18px] sm:rounded-[24px] rounded-bl-[4px] sm:rounded-bl-[8px] bg-white border border-black/[0.05] shadow-sm">
                                    <div className="flex items-center gap-1.5 h-4">
                                        <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce opacity-50", themeColor)} style={{ animationDelay: '0ms' }} />
                                        <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce opacity-50", themeColor)} style={{ animationDelay: '150ms' }} />
                                        <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce opacity-50", themeColor)} style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )
            )}

            {/* ── Input Box (Gemini-style) ── */}
            <div className="w-full shrink-0 pt-1.5 sm:pt-2 bg-[#F5F5F7]/95 backdrop-blur z-50 border-t border-black/[0.05] px-3 sm:px-6 pb-chat-mobile sticky bottom-0">
                {isFreeLimitReached ? (
                    <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3">
                        <p className="text-[13px] sm:text-[14px] text-[#1D1D1F] font-medium leading-relaxed max-w-sm mx-auto">
                            Tu as atteint ta limite de <b className={cn("font-extrabold", themeTextColor)}>{maxFreeMessages} messages</b> offerts avec {agentName}.
                        </p>
                        <Link href="/auth/choose-plan" className={cn("w-full max-w-sm shrink-0 rounded-[22px] text-white flex items-center justify-center font-bold text-xs sm:text-sm h-11 transition-apple shadow-md active:scale-95", themeColor, themeHoverColor)}>
                            {upgradeLinkText}
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Suggestion chips */}
                        {userMessagesCount > 0 && suggestions.length > 0 && !isTyping && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-1 animate-in slide-in-from-bottom-2 duration-500">
                                {suggestions.map(reply => (
                                    <button
                                        key={reply}
                                        onClick={() => sendMessage(reply)}
                                        className={cn("shrink-0 text-[12px] sm:text-[13px] font-bold bg-white border px-4 py-2.5 rounded-2xl transition-apple shadow-sm whitespace-nowrap bg-opacity-10", themeTextColor, `border-${themeColor}/20 hover:bg-${themeColor}/5`)}
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tech pack image preview */}
                        {allowImageUpload && pendingImage && (
                            <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-2xl border border-blue-500/20 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={pendingImage.preview}
                                    alt="Tech pack"
                                    className="w-12 h-12 rounded-xl object-cover border border-black/5"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-[#1D1D1F] truncate">Fichier prêt</p>
                                    <p className="text-[10px] text-[#86868B]">{agentName} va l'analyser</p>
                                </div>
                                <button
                                    onClick={() => setPendingImage(null)}
                                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                                >
                                    <X className="w-4 h-4 text-[#86868B]" />
                                </button>
                            </div>
                        )}

                        <div className="pb-2.5 sm:pb-6">
                            <form onSubmit={handleSubmit} className="relative flex items-end gap-1.5 sm:gap-2 bg-white border border-black/[0.08] rounded-[22px] sm:rounded-[28px] shadow-apple-lg p-0.5 sm:p-1.5 transition-all focus-within:ring-4 focus-within:ring-opacity-10 z-30">
                                {allowImageUpload && (
                                    <div className="flex items-center pl-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-apple active:scale-95 text-[#86868B]"
                                            title="Joindre un fichier"
                                        >
                                            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                )}
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, getMaxTextareaHeight()) + 'px';
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if ((input.trim() || (allowImageUpload && pendingImage)) && !isTyping) sendMessage(input, pendingImage?.file);
                                        }
                                    }}
                                    placeholder={`Parler à ${agentName}...`}
                                    className="flex-1 bg-transparent max-h-[88px] sm:max-h-[120px] min-h-[36px] sm:min-h-[44px] px-2.5 sm:px-4 py-2 sm:py-3 text-[16px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none resize-none leading-[1.3] sm:leading-relaxed"
                                    disabled={isTyping}
                                    rows={1}
                                />
                                <button
                                    type="submit"
                                    disabled={isTyping || (!input.trim() && !(allowImageUpload && pendingImage))}
                                    className={cn("w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-[18px] sm:rounded-[22px] disabled:opacity-30 text-white flex items-center justify-center transition-apple m-0.5 shadow-md active:scale-95", themeColor, themeHoverColor)}
                                >
                                    {isTyping ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
                                </button>
                            </form>
                            <p className="text-[10px] text-[#86868B] text-center mt-2 font-medium">
                                {agentName} peut commettre des erreurs. Vérifiez les informations importantes.
                            </p>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}
