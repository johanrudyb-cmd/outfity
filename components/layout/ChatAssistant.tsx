'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Loader2, BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello ! Je suis Virgil, le Directeur Stratégique et Marketing de ta marque. Pose-moi tes questions stratégiques ou créatives." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pendingAnalysis, setPendingAnalysis] = useState<{ target: string; message: string } | null>(null);

    const [unreadCount, setUnreadCount] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset unread count when opening
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Handle unread messages
    useEffect(() => {
        if (!isOpen && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
                setUnreadCount(prev => prev + 1);
            }
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (confirm = false) => {
        const textToSend = confirm ? pendingAnalysis?.message : input;
        if (!textToSend?.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
        if (!confirm) {
            setMessages(newMessages);
            setInput('');
        }

        setIsLoading(true);
        setPendingAnalysis(null);

        try {
            const res = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    confirmedAnalysis: confirm
                }),
            });

            const data = await res.json();

            if (res.status === 402 || (data.intent === 'analysis' && !confirm)) {
                // Détecté comme analyse mais pas confirmé
                setPendingAnalysis({
                    target: data.analysis_target || 'cette analyse',
                    message: textToSend
                });
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.reply || "Cette demande nécessite une analyse approfondie et consommera un crédit d'analyse. Veux-tu continuer ?"
                }]);
            } else if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Désolé, j'ai rencontré une erreur : ${data.error}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Une erreur réseau est survenue. Réessaie plus tard." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full shadow-apple-lg flex items-center justify-center transition-colors shadow-2xl overflow-visible",
                    isOpen ? "bg-white text-black" : "bg-black text-white"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}

                {/* Notification Badge */}
                <AnimatePresence>
                    {!isOpen && unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-[#FF3B30] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] z-[70]"
                        >
                            {unreadCount}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        className="fixed bottom-24 right-6 z-[60] w-[90vw] sm:w-[400px] h-[600px] max-h-[70vh] bg-white/80 backdrop-blur-2xl border border-black/[0.05] rounded-[32px] shadow-apple-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-black/[0.03] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shadow-apple">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-black">Virgil</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                                            <span className="text-[10px] font-bold text-[#6e6e73]">Directeur Stratégique et Marketing</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth no-scrollbar"
                        >
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex flex-col max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto items-end" : "items-start"
                                    )}
                                >
                                    <div className={cn(
                                        "px-4 py-3 rounded-[20px] text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-black text-white rounded-tr-none"
                                            : "bg-[#F5F5F7] text-black rounded-tl-none"
                                    )}>
                                        <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-center gap-2 text-[#6e6e73]">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-[11px] font-black uppercase tracking-widest italic">Analyse DA en cours...</span>
                                </div>
                            )}

                            {pendingAnalysis && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/10 space-y-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-2 text-[#007AFF]">
                                        <BarChart3 className="w-4 h-4" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">Analyse Premium requise</span>
                                    </div>
                                    <p className="text-xs text-[#6e6e73] font-medium">Cette demande nécessite une expertise approfondie pour vous fournir un rapport de marque de haute qualité.</p>
                                    <button
                                        onClick={() => handleSend(true)}
                                        className="w-full h-10 rounded-full bg-[#007AFF] text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-apple hover:scale-[1.02] transition-all"
                                    >
                                        Lancer l'analyse experte (1 crédit)
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-black/[0.03] bg-white/50">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Pose ta question..."
                                    className="w-full h-12 pl-6 pr-14 rounded-full bg-[#F5F5F7] border-none text-[13px] font-medium focus:ring-2 focus:ring-black/5 outline-none"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-20 transition-all hover:scale-105"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
