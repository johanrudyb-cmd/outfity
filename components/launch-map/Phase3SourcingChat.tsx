'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ArrowLeft, Loader2, ArrowRight, ExternalLink, Check, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { BrandIdentity } from './LaunchMapStepper';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    imagePreview?: string; // base64 preview for tech pack images
}

interface Phase3SourcingChatProps {
    brandId: string;
    brand?: BrandIdentity | null;
    onComplete?: () => void;
    userPlan?: string;
}

// Renders message content — handles [Button](/link) and __SEND_QUOTE:[id]__ tokens
function MessageContent({
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

    // Strip suggestion chips from display
    const displayContent = content.replace(/\[\[.*?\]\]/g, '').trim();

    // Extract __SEND_QUOTE:[id]__ tokens
    const quoteMatches = [...displayContent.matchAll(/__SEND_QUOTE:([\w-]+)__/g)];
    const factoryIds = quoteMatches.map(m => m[1]);
    const cleanedContent = displayContent.replace(/__SEND_QUOTE:[\w-]+__/g, '').trim();

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
                        "inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all shadow-sm mr-2 active:scale-95",
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

export function Phase3SourcingChat({
    brandId,
    brand,
    onComplete,
    userPlan = 'free',
}: Phase3SourcingChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [quoteSentCount, setQuoteSentCount] = useState(0);
    const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasInitialized = useRef(false);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

    // Init — load from localStorage or fetch Ada's intro
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        try {
            const saved = localStorage.getItem(`ada-chat-${brandId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
                    return;
                }
            }
        } catch { /* ignore */ }

        setIsTyping(true);
        fetch('/api/launch-map/sourcing-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandId, messages: [{ role: 'user', content: '__INIT__' }] }),
        })
            .then(r => r.json())
            .then(data => {
                const raw = data.reply || `Bonjour ! Je suis Ada, ton experte Sourcing. Je vais t'aider à trouver l'usine idéale. Pour commencer — quel type de vêtement tu veux produire ? [[T-shirt|Hoodie|Veste|Autre chose]]`;
                const suggestMatch = raw.match(/\[\[(.*?)\]\]/);
                if (suggestMatch) setSuggestions(suggestMatch[1].split('|'));
                setMessages([{ id: 'ada-intro', role: 'assistant', content: raw, timestamp: new Date() }]);
            })
            .catch(() => {
                const fallback = `Bonjour ! Je suis Ada, ton experte Sourcing chez OUTFITY. Je vais t'aider à trouver les meilleures usines pour ta collection, sur mesure selon ton projet. Quel type de vêtement veux-tu produire ? [[T-shirt|Hoodie|Veste|Autre chose]]`;
                setSuggestions(['T-shirt', 'Hoodie', 'Veste', 'Autre chose']);
                setMessages([{ id: 'ada-intro', role: 'assistant', content: fallback, timestamp: new Date() }]);
            })
            .finally(() => setIsTyping(false));
    }, [brandId]);

    // Persist
    useEffect(() => {
        if (messages.length > 0) localStorage.setItem(`ada-chat-${brandId}`, JSON.stringify(messages));
    }, [messages, brandId]);

    const sendMessage = useCallback(async (text: string, imageFile?: File) => {
        if ((!text.trim() && !imageFile) || isTyping) return;

        const imagePreview = imageFile ? URL.createObjectURL(imageFile) : undefined;
        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text.trim() || '(Tech pack envoyé)',
            timestamp: new Date(),
            imagePreview,
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setSuggestions([]);
        setIsTyping(true);
        setPendingImage(null);

        try {
            let res: Response;

            if (imageFile) {
                // Multipart with image
                const formData = new FormData();
                formData.append('brandId', brandId);
                formData.append('messages', JSON.stringify(
                    updatedMessages.map(m => ({ role: m.role, content: m.content }))
                ));
                formData.append('techPack', imageFile);
                res = await fetch('/api/launch-map/sourcing-chat', { method: 'POST', body: formData });
            } else {
                res = await fetch('/api/launch-map/sourcing-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        brandId,
                        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    }),
                });
            }

            const data = await res.json();
            const raw = data.reply || 'Je rencontre un souci technique. Réessaie dans un instant.';

            const suggestMatch = raw.match(/\[\[(.*?)\]\]/);
            setSuggestions(suggestMatch ? suggestMatch[1].split('|') : []);

            setMessages(prev => [...prev, {
                id: `ada-${Date.now()}`,
                role: 'assistant',
                content: raw,
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
    }, [messages, brandId, isTyping]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input, pendingImage?.file);
    };

    const userMessagesCount = messages.filter(m => m.role === 'user').length;
    const isFreeLimitReached = userPlan === 'free' && userMessagesCount >= 10;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setPendingImage({ file, preview });
        // Tell Ada that a tech pack will arrive
        setInput("Voici mon tech pack :");
        inputRef.current?.focus();
        e.target.value = '';
    };

    const resetChat = () => {
        localStorage.removeItem(`ada-chat-${brandId}`);
        hasInitialized.current = false;
        setMessages([]);
        setSuggestions([]);
        setPendingImage(null);
        setIsTyping(true);
        fetch('/api/launch-map/sourcing-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandId, messages: [{ role: 'user', content: '__INIT__' }] }),
        })
            .then(r => r.json())
            .then(data => {
                const raw = data.reply || 'Bonjour, quel type de vêtement veux-tu produire ? [[T-shirt|Hoodie|Veste]]';
                const suggestMatch = raw.match(/\[\[(.*?)\]\]/);
                if (suggestMatch) setSuggestions(suggestMatch[1].split('|'));
                setMessages([{ id: 'ada-reset', role: 'assistant', content: raw, timestamp: new Date() }]);
            })
            .finally(() => setIsTyping(false));
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#F5F5F7] font-sans relative overflow-hidden flex-1 min-h-0">

            {/* ── Header ── */}
            <div className="bg-white/95 backdrop-blur-xl border-b border-black/[0.1] px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                    <Link href="/launch-map" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5 text-[#86868B]" />
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                        <div className="relative shrink-0">
                            <img
                                src="/images/agents/ada_final.png"
                                alt="Ada"
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm border border-black/5"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-extrabold text-[#1D1D1F] text-[13px] sm:text-[15px] leading-tight truncate">Ada</h3>
                            <p className="text-[9px] sm:text-[10px] text-[#86868B] font-bold uppercase tracking-wider leading-none mt-0.5">Sourcing</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <Button onClick={onComplete} className="h-8 sm:h-9 text-[10px] sm:text-xs font-bold rounded-xl gap-1.5 px-3 sm:px-4 bg-[#007AFF] hover:bg-[#0056CC] text-white shadow-sm transition-apple">
                        <span className="hidden xs:inline">Terminer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* ── Messages Chat UI ── */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-4 sm:pb-6 stylish-scrollbar relative z-0 flex flex-col gap-3.5 sm:gap-4">
                {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={msg.id} className={cn("flex items-end gap-1.5 sm:gap-2 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] group", isUser ? 'self-end flex-row-reverse' : 'self-start')}>
                            {!isUser && (
                                <img
                                    src="/images/agents/ada_final.png"
                                    alt="Ada"
                                    className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full object-cover shadow-sm border border-black/5 mb-0.5"
                                />
                            )}
                            <div
                                className={cn(
                                    "px-3.5 py-2 sm:px-4 sm:py-3 rounded-[18px] sm:rounded-[24px] text-[14px] sm:text-[15px] leading-relaxed shadow-sm break-words relative transition-apple",
                                    isUser
                                        ? "bg-[#007AFF] text-white rounded-br-[4px] sm:rounded-br-[8px]"
                                        : "bg-white text-[#1D1D1F] border border-black/[0.05] rounded-bl-[4px] sm:rounded-bl-[8px]"
                                )}
                            >
                                <div className="max-w-none">
                                    <MessageContent content={msg.content} isUser={isUser} brandId={brandId} />
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
                        <img
                            src="/images/agents/ada_final.png"
                            alt="Ada"
                            className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full object-cover shadow-sm border border-black/5 mb-0.5"
                        />
                        <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-[18px] sm:rounded-[24px] rounded-bl-[4px] sm:rounded-bl-[8px] bg-white border border-black/[0.05] shadow-sm">
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

            {/* ── Input Box (Gemini-style) ── */}
            <div className="w-full shrink-0 pt-2 pb-safe-bottom bg-[#F5F5F7]/95 backdrop-blur z-20 border-t border-black/[0.05] px-3 sm:px-6">
                {isFreeLimitReached ? (
                    <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3">
                        <p className="text-[13px] sm:text-[14px] text-[#1D1D1F] font-medium leading-relaxed max-w-sm mx-auto">
                            Tu as atteint ta limite de <b className="font-extrabold text-[#007AFF]">10 messages</b> offerts avec Ada.
                        </p>
                        <Link href="/auth/choose-plan" className="w-full max-w-sm shrink-0 rounded-[22px] bg-[#007AFF] hover:bg-[#0056CC] text-white flex items-center justify-center font-bold text-xs sm:text-sm h-11 transition-apple shadow-md active:scale-95">
                            Débloquer Sourcing Pro
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Suggestion chips */}
                        {suggestions.length > 0 && !isTyping && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-1 animate-in slide-in-from-bottom-2 duration-500">
                                {suggestions.map(reply => (
                                    <button
                                        key={reply}
                                        onClick={() => {
                                            sendMessage(reply);
                                            setSuggestions([]);
                                        }}
                                        className="shrink-0 text-[12px] sm:text-[13px] font-bold text-[#007AFF] bg-white border border-[#007AFF]/15 hover:bg-blue-50 active:bg-blue-100 px-4 py-2.5 rounded-2xl transition-apple shadow-sm whitespace-nowrap"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Tech pack image preview */}
                        {pendingImage && (
                            <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-2xl border border-blue-500/20 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                                <img
                                    src={pendingImage.preview}
                                    alt="Tech pack"
                                    className="w-12 h-12 rounded-xl object-cover border border-black/5"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-[#1D1D1F] truncate">Tech pack prêt</p>
                                    <p className="text-[10px] text-[#86868B]">Ada va l'analyser</p>
                                </div>
                                <button
                                    onClick={() => setPendingImage(null)}
                                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                                >
                                    <X className="w-4 h-4 text-[#86868B]" />
                                </button>
                            </div>
                        )}

                        <div>
                            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-white border border-black/[0.08] rounded-[28px] shadow-apple-lg p-1.5 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/30 z-30">
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
                                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-apple active:scale-95 text-[#86868B]"
                                        title="Envoyer ton tech pack"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                </div>
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
                                            if ((input.trim() || pendingImage) && !isTyping) sendMessage(input, pendingImage?.file);
                                        }
                                    }}
                                    placeholder="Écrire à Ada..."
                                    className="flex-1 bg-transparent max-h-[120px] min-h-[44px] px-2 py-3 text-[15px] sm:text-[16px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none resize-none leading-relaxed"
                                    disabled={isTyping}
                                    rows={1}
                                />
                                <button
                                    type="submit"
                                    disabled={isTyping || (!input.trim() && !pendingImage)}
                                    className="w-11 h-11 shrink-0 rounded-[22px] bg-[#007AFF] hover:bg-[#0056CC] disabled:opacity-30 disabled:hover:bg-[#007AFF] text-white flex items-center justify-center transition-apple m-0.5 shadow-md active:scale-95"
                                >
                                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .stylish-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        .stylish-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe-bottom { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
      `}} />
        </div>
    );
}
