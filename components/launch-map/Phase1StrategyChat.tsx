'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Send,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Pencil,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BrandIdentity } from './LaunchMapStepper';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface Phase1StrategyChatProps {
    brandId: string;
    brand?: BrandIdentity | null;
    onComplete: () => void;
    userPlan?: string;
    onShowClassic?: () => void;
}

const QUICK_REPLIES = [
    "Explique-moi ma stratégie",
    "Mettre à jour la stratégie",
    "Comment l'appliquer ?",
    "Que faire en premier ?",
];

export function Phase1StrategyChat({
    brandId,
    brand,
    onComplete,
    userPlan = 'free',
    onShowClassic,
}: Phase1StrategyChatProps) {
    // Renders content with markdown-like [Button Text](/link) parsing
    function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
        // Hide suggestions [[...]] from the text bubble
        const displayContent = content.replace(/\[\[.*?\]\]/g, '').trim();

        const parts = displayContent.split(/(\[.*?\]\(.*?\))/g);
        const elements = parts.map((part, i) => {
            const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (match) {
                const [, label, url] = match;
                // If the link points to the strategy phase, trigger the classic view
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
                            {label}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    );
                }
                return (
                    <Link
                        key={i}
                        href={url}
                        className={cn(
                            "inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all no-underline shadow-sm",
                            isUser ? "bg-white text-[#007AFF]" : "bg-[#007AFF] text-white hover:bg-[#0056CC]"
                        )}
                    >
                        {label}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                );
            }
            return (
                <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
                    {part}
                </span>
            );
        });

        return <div className="leading-relaxed text-[15px]">{elements}</div>;
    }

    const [messages, setMessages] = useState<Message[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const hasInitialized = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

    // Initialize chat — load from localStorage or fetch Virgil's intro from API
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        try {
            const saved = localStorage.getItem(`virgil-chat-${brandId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const loaded = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
                    setMessages(loaded);
                    setSuggestions(QUICK_REPLIES);
                    return;
                }
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
        }

        const intro: Message = {
            id: 'virgil-intro',
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };
        setIsTyping(true);

        fetch('/api/launch-map/strategy-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                brandId,
                messages: [{ role: 'user', content: '__INIT__' }],
            }),
        })
            .then(r => r.json())
            .then(data => {
                const rawContent = data.reply || `Salut ! Je suis Virgil, ton expert stratégie chez OUTFITY. J'analyse ta marque et je t'aide à déployer ton plan d'attaque. Par quoi veux-tu commencer ? [[Explique-moi ma stratégie|Comment l'appliquer ?|Créer mon contenu]]`;
                intro.content = rawContent;
                // Extract suggestions
                const suggestMatch = rawContent.match(/\[\[(.*?)\]\]/);
                if (suggestMatch) setSuggestions(suggestMatch[1].split('|'));
                else setSuggestions(QUICK_REPLIES);
                setMessages([{ ...intro }]);
            })
            .catch(() => {
                intro.content = `Salut ! Je suis Virgil, ton Directeur Stratégique chez OUTFITY. Je suis là pour t'aider à déployer ta stratégie de marque. [[Explique-moi ma stratégie|Comment l'appliquer ?|Que faire en premier ?]]`;
                setSuggestions(QUICK_REPLIES);
                setMessages([{ ...intro }]);
            })
            .finally(() => setIsTyping(false));
    }, [brandId]);

    // Persist chat to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(`virgil-chat-${brandId}`, JSON.stringify(messages));
        }
    }, [messages, brandId]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isTyping) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setSuggestions([]);
        setIsTyping(true);

        try {
            const res = await fetch('/api/launch-map/strategy-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();
            const rawContent = data.reply || "Je rencontre un souci technique. Réessaie dans un instant.";

            // Extract suggestions from [[...]]
            const suggestMatch = rawContent.match(/\[\[(.*?)\]\]/);
            if (suggestMatch) setSuggestions(suggestMatch[1].split('|'));
            else setSuggestions([]);

            const virgilMsg: Message = {
                id: `virgil-${Date.now()}`,
                role: 'assistant',
                content: rawContent,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, virgilMsg]);
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
    }, [messages, brandId, isTyping]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#F5F5F7] font-sans relative overflow-hidden flex-1 min-h-0">

            {/* ── Header ── */}
            <div className="bg-white/95 backdrop-blur-xl border-b border-black/[0.04] px-4 py-1.5 sm:py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link href="/launch-map" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-[#86868B]" />
                    </Link>
                    <div className="h-6 w-px bg-black/5 hidden sm:block" />
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative shrink-0">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-[#1D1D1F] text-[12px] sm:text-[15px] leading-tight truncate">Virgil</h3>
                            <p className="text-[8px] sm:text-[10px] text-[#86868B] font-bold uppercase tracking-tighter sm:tracking-normal leading-none mt-0.5">Stratégie & Marketing</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Button to access the classic form to update strategy */}
                    {onShowClassic && (
                        <Button
                            onClick={onShowClassic}
                            variant="outline"
                            className="h-6 sm:h-9 text-[9px] sm:text-xs font-bold rounded-full gap-1 px-2 sm:px-4 shadow-sm border-black/10 transition-all active:scale-95"
                        >
                            <Pencil className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden xs:inline">Modifier la stratégie</span>
                            <span className="xs:hidden">Modifier</span>
                        </Button>
                    )}
                    <Button
                        onClick={onComplete}
                        variant="outline"
                        className="h-6 sm:h-9 text-[9px] sm:text-xs font-bold rounded-full gap-1 px-2.5 sm:px-4 shadow-sm border-black/10 transition-all active:scale-95"
                    >
                        <span className="hidden xs:inline">Phase terminée</span>
                        <span className="xs:hidden">Finir</span>
                        <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── Messages Chat UI ── */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-4 stylish-scrollbar relative z-0 flex flex-col gap-3.5 sm:gap-4">
                {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={msg.id} className={cn("flex items-end gap-1.5 sm:gap-2 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] group", isUser ? 'self-end flex-row-reverse' : 'self-start')}>
                            {!isUser && (
                                <div className="w-5 h-5 sm:w-7 sm:h-7 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-0.5 shadow-sm">
                                    <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "px-3.5 py-2 sm:px-4 sm:py-3 rounded-[16px] sm:rounded-[24px] text-[14px] sm:text-[15px] leading-relaxed shadow-sm break-words relative",
                                    isUser
                                        ? "bg-[#007AFF] text-white rounded-br-[4px] sm:rounded-br-[8px]"
                                        : "bg-white text-[#1D1D1F] border border-black/[0.05] rounded-bl-[4px] sm:rounded-bl-[8px]"
                                )}
                            >
                                <div className="max-w-none">
                                    <MessageContent content={msg.content} isUser={isUser} />
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
                        <div className="w-5 h-5 sm:w-7 sm:h-7 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                            <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
                        </div>
                        <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-[16px] sm:rounded-[24px] rounded-bl-[4px] sm:rounded-bl-[8px] bg-white border border-black/[0.05] shadow-sm">
                            <div className="flex items-center gap-1.5 h-4">
                                <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* ── Input Box ── */}
            <div className="shrink-0 pt-2 pb-4 sm:pb-8 px-3 sm:px-6 bg-[#F5F5F7] z-20 pb-safe-bottom border-t border-black/[0.03]">
                {suggestions.length > 0 && !isTyping && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {suggestions.map(reply => (
                            <button
                                key={reply}
                                onClick={() => {
                                    if (reply === "Mettre à jour la stratégie") {
                                        onShowClassic?.();
                                    } else {
                                        sendMessage(reply);
                                    }
                                    setSuggestions([]);
                                }}
                                className="shrink-0 text-[11px] sm:text-[13px] font-bold text-blue-600 bg-white border border-blue-600/20 hover:bg-blue-600/5 px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm whitespace-nowrap"
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-white border border-black/[0.08] rounded-[28px] shadow-sm p-1.5 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 z-30">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (input.trim() && !isTyping) sendMessage(input);
                            }
                        }}
                        placeholder="Écrire à Virgil..."
                        className="flex-1 bg-transparent max-h-[120px] min-h-[40px] px-4 py-3 text-[15px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none resize-none leading-relaxed"
                        disabled={isTyping}
                        rows={1}
                    />
                    <button
                        type="submit"
                        disabled={isTyping || !input.trim()}
                        className="w-10 h-10 shrink-0 rounded-[20px] bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-all m-0.5 shadow-md shadow-blue-500/20 active:scale-95"
                    >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                    </button>
                </form>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .stylish-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        .stylish-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
    );
}
