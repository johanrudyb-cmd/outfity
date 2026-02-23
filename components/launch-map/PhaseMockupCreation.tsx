'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, RefreshCw, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandIdentity } from './LaunchMapStepper';
import { MockupPackSelector } from './MockupPackSelector';

interface PhaseMockupCreationProps {
  brandId: string;
  brand?: BrandIdentity | null;
  onComplete: () => void;
  userPlan?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Renders markdown-like content. Handles __SHOW_MOCKUP_SELECTOR__ magic string
function MessageContent({ content, isUser, brandId, brandName, userPlan }: { content: string, isUser: boolean, brandId: string, brandName?: string, userPlan?: string }) {
  if (content.includes('__SHOW_MOCKUP_SELECTOR__')) {
    const textPart = content.replace('__SHOW_MOCKUP_SELECTOR__', '').trim();
    return (
      <div className="space-y-4">
        {textPart && <div className="leading-relaxed text-[15px] whitespace-pre-wrap">{textPart}</div>}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-black/5">
          <MockupPackSelector brandId={brandId} brandName={brandName} inline userPlan={userPlan} />
        </div>
      </div>
    );
  }

  // Handle links like [Option 1](url)
  const parts = content.split(/(\[.*?\]\(.*?\))/g);
  const elements = parts.map((part, i) => {
    const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (match) {
      const [, label, url] = match;
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all no-underline shadow-sm",
            isUser ? "bg-white text-[#007AFF]" : "bg-[#007AFF] text-white hover:bg-[#0056CC]"
          )}
        >
          {label}
          <ArrowRight className="w-4 h-4" />
        </a>
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

const QUICK_REPLIES = [
  "J'ai un petit budget (Canva ?)",
  "Je maîtrise Photoshop",
  "Je veux déléguer le design",
  "Je veux mon pack mockup",
];

export function PhaseMockupCreation({ brandId, brand, onComplete, userPlan }: PhaseMockupCreationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      const saved = localStorage.getItem(`mockup-chat-${brandId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loaded = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          setMessages(loaded);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }

    const intro: Message = {
      id: 'johan-intro',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setIsTyping(true);

    fetch('/api/launch-map/mockup-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId,
        messages: [{ role: 'user', content: '__INIT__' }],
      }),
    })
      .then(r => r.json())
      .then(data => {
        intro.content = data.reply || `Salut ! Je suis Johan, ton designer 3D 👋 C'est l'heure de créer tes mockups. Sais-tu déjà quel outil utiliser (Canva, Photoshop...) ou on fait le point sur ton budget/tes compétences ?`;
        setMessages([{ ...intro }]);
      })
      .catch(() => {
        intro.content = `Salut ! Je suis Johan, ton designer 3D 👋 Prêt à passer à la création des mockups ? Avant de télécharger ton pack, quel est ton niveau technique ? Plutôt Canva (débutant) ou Photoshop (pro) ?`;
        setMessages([{ ...intro }]);
      })
      .finally(() => setIsTyping(false));
  }, [brandId]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`mockup-chat-${brandId}`, JSON.stringify(messages));
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
    setIsTyping(true);

    try {
      const res = await fetch('/api/launch-map/mockup-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const johanMsg: Message = {
        id: `johan-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Je rencontre un souci technique. Réessaie dans un instant.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, johanMsg]);
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

  const resetChat = () => {
    localStorage.removeItem(`mockup-chat-${brandId}`);
    hasInitialized.current = false;
    setMessages([]);
    setIsTyping(true);
    fetch('/api/launch-map/mockup-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, messages: [{ role: 'user', content: '__INIT__' }] }),
    })
      .then(r => r.json())
      .then(data => {
        setMessages([{
          id: `johan-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'On reprend à zéro ! Par où veux-tu commencer ?',
          timestamp: new Date(),
        }]);
      })
      .finally(() => setIsTyping(false));
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F5F7] font-sans relative">

      {/* ── Header ── */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#1D1D1F] text-[15px] leading-tight">Johan</h3>
            <p className="text-[11px] text-[#86868B] font-medium">Expert Mockup & 3D</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onComplete} variant="outline" className="h-8 text-xs font-bold rounded-full gap-2 px-4 shadow-sm">
            Phase terminée <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <button
            onClick={resetChat}
            className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center hover:bg-[#D1D1D6] transition-colors text-[#1D1D1F]"
            title="Rafraîchir"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Messages Chat UI ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-4 stylish-scrollbar relative z-0 flex flex-col gap-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={cn("flex items-end gap-2 max-w-[90%] sm:max-w-[75%] group", isUser ? 'self-end flex-row-reverse' : 'self-start')}>
              {!isUser && (
                <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "px-4 py-3 rounded-[24px] text-[15px] leading-relaxed shadow-sm break-words relative",
                  isUser
                    ? "bg-[#007AFF] text-white rounded-br-[8px]"
                    : "bg-white text-[#1D1D1F] border border-black/[0.04] rounded-bl-[8px]"
                )}
              >
                <div className="prose prose-sm max-w-none">
                  <MessageContent content={msg.content} isUser={isUser} brandId={brandId} brandName={brand?.name} userPlan={userPlan} />
                </div>
                <div className={cn(
                  "absolute -bottom-5 text-[10px] text-[#86868B] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                  isUser ? "right-1" : "left-1"
                )}>
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2 self-start max-w-[85%] sm:max-w-[75%]">
            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-5 py-3.5 rounded-[24px] rounded-bl-[8px] bg-white border border-black/[0.04] shadow-sm">
              <div className="flex items-center gap-1.5 h-4">
                <div className="w-2 h-2 bg-[#86868B]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#86868B]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#86868B]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ── Input Box ── */}
      <div className="shrink-0 pt-2 pb-32 sm:pb-6 px-4 sm:px-6 bg-[#F5F5F7] z-20 pb-safe">
        {messages.length <= 2 && !isTyping && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {QUICK_REPLIES.map(reply => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="shrink-0 text-[13px] font-semibold text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/20 px-4 py-2 rounded-full transition-all active:scale-95"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-white border border-black/[0.08] rounded-[28px] shadow-sm p-1.5 transition-all focus-within:ring-2 focus-within:ring-[#007AFF]/20 focus-within:border-[#007AFF]/50 z-30">
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
            placeholder="Écrire à Johan..."
            className="flex-1 bg-transparent max-h-[120px] min-h-[40px] px-4 py-3 text-[15px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none resize-none leading-relaxed"
            disabled={isTyping}
            rows={1}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="w-10 h-10 shrink-0 rounded-[20px] bg-[#007AFF] hover:bg-[#0056CC] disabled:opacity-40 disabled:hover:bg-[#007AFF] text-white flex items-center justify-center transition-all m-0.5 shadow-md shadow-blue-500/20 active:scale-95"
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
