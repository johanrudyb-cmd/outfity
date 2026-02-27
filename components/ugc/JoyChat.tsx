'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageCircle, Send, Loader2, Calendar as CalendarIcon, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface JoyChatProps {
    brandId: string;
    brandName: string;
    initialImageUrl?: string;
}

export function JoyChat({ brandId, brandName, initialImageUrl }: JoyChatProps) {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        {
            role: 'assistant',
            content: `Salut ! Moi c'est **Joy**, ton experte en stratégie de contenu et direction artistique ✨\n\nJ'ai bien étudié l'ADN de ${brandName}. Dis-moi ce que tu veux faire ! On peut trouver des idées de TikTok viraux, scripter des Reels, définir ta charte ou prévoir tes lancements.`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await fetch('/api/chat/joy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandId, messages: newMessages, contextImageUrl: initialImageUrl }),
            });

            if (!res.ok) {
                throw new Error('Erreur de communication avec Joy.');
            }

            const data = await res.json();
            setMessages([...newMessages, { role: 'assistant', content: data.text }]);
        } catch (err) {
            console.error(err);
            setMessages([...newMessages, { role: 'assistant', content: 'Désolée, j\'ai eu un bug de réseau. Tu peux recommencer ? 😓' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start h-[70vh] min-h-[500px]">
            {/* Colonne gauche : Le Chat */}
            <Card className="h-full flex flex-col overflow-hidden">
                <CardHeader className="py-4 border-b shrink-0 flex flex-row items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#AF52DE]/10 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-[#AF52DE]" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            L'Agence de Joy
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium">Ton experte DA & Réseaux Sociaux</p>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                    {initialImageUrl && (
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-[#AF52DE]/20 bg-[#AF52DE]/5">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-black/10">
                                <img src={initialImageUrl} alt="Context" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-[#1D1D1F] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#AF52DE]" /> Produit ciblé</p>
                                <p className="text-[11px] text-[#86868B] mt-0.5">Joy s'inspirera de ce produit pour la création.</p>
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={cn("flex items-end gap-2", m.role === 'user' ? "justify-end" : "justify-start")}>
                            {m.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-[#AF52DE] shrink-0 flex items-center justify-center shadow-md">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div className={cn(
                                "px-4 py-3 rounded-[20px] max-w-[85%] text-sm",
                                m.role === 'user'
                                    ? "bg-[#1D1D1F] text-white rounded-br-[5px]"
                                    : "bg-white border shadow-sm text-[#1D1D1F] rounded-bl-[5px] prose prose-sm prose-p:leading-relaxed max-w-none"
                            )}>
                                {m.role === 'user' ? (
                                    m.content
                                ) : (
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                )}
                            </div>

                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="w-8 h-8 rounded-full bg-[#AF52DE] shrink-0 flex items-center justify-center shadow-md">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-[20px] bg-white border shadow-sm rounded-bl-[5px] flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </CardContent>

                <div className="p-4 border-t bg-white shrink-0">
                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        <div className="flex-1 bg-muted/50 border rounded-2xl px-4 py-2 focus-within:ring-2 ring-[#AF52DE]/30 focus-within:bg-white transition-all">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ex: Donne-moi 3 idées de TikTok vitrine pour ce manteau..."
                                className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[44px] max-h-[120px] text-sm py-2"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="rounded-full w-12 h-12 p-0 shrink-0 bg-[#AF52DE] hover:bg-[#AF52DE]/90 text-white shadow-md shadow-[#AF52DE]/20"
                        >
                            <Send className="w-5 h-5 ml-1" />
                        </Button>
                    </form>
                </div>
            </Card>

            {/* Colonne droite : Actions Rapides & Calendrier */}
            <div className="space-y-4 hidden md:block">
                <Card className="border shadow-sm">
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-[#AF52DE]" /> Suggestions Sprap
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {[
                            "Génère-moi 3 Hooks TikTok",
                            "Écris la légende de ce post Insta",
                            "Idée de Reel virale pour dimanche",
                            "Quel est le ton de notre marque ?"
                        ].map(sug => (
                            <button
                                key={sug}
                                onClick={() => setInput(sug)}
                                className="w-full text-left text-xs bg-muted/30 hover:bg-muted p-2.5 rounded-lg border border-transparent hover:border-border transition-colors truncate"
                            >
                                {sug}
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border shadow-sm bg-[#007AFF]/5 border-[#007AFF]/20">
                    <CardContent className="p-5 flex flex-col items-center text-center">
                        <CalendarIcon className="w-8 h-8 text-[#007AFF] mb-3" />
                        <h4 className="text-sm font-bold text-[#1D1D1F] mb-1">Passer à l'action</h4>
                        <p className="text-xs text-[#86868B] mb-4">
                            Satisfait(e) des idées générées par Joy ? Planifie tes contenus officiellement !
                        </p>
                        <Link href="/launch-map/calendar" className="inline-flex items-center justify-center rounded-ull h-9 px-4 text-xs font-bold bg-[#007AFF] text-white hover:bg-[#007AFF]/90 rounded-full w-full">
                            Ouvrir le Calendrier →
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
