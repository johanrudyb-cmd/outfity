'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandIdentity } from './LaunchMapStepper';
import { MockupPackSelector } from './MockupPackSelector';
import Link from 'next/link';

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
export function MessageContent({ content, isUser, brandId, brandName, userPlan }: { content: string, isUser: boolean, brandId: string, brandName?: string, userPlan?: string }) {
  // Hide suggestions [[...]] and mockup selector from the text bubble
  let displayContent = content.replace(/\[\[.*?\]\]/g, '').trim();

  const matchRender = displayContent.match(/__SHOW_MOCKUP_SELECTOR(?::([a-zA-Z0-9_\-]+))?__/);
  if (matchRender) {
    const typeFilter = matchRender[1];
    const textPart = displayContent.replace(matchRender[0], '').trim();
    return (
      <div className="space-y-4">
        {textPart && <div className="leading-relaxed text-[15px] whitespace-pre-wrap">{textPart}</div>}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-black/5">
          <MockupPackSelector brandId={brandId} brandName={brandName} inline userPlan={userPlan} typeFilter={typeFilter} />
        </div>
      </div>
    );
  }

  // Update internal displayContent for further processing
  const finalContent = displayContent;

  // Handle links like [Option 1](url)
  const parts = finalContent.split(/(\[.*?\]\(.*?\))/g);
  const elements = parts.map((part, i) => {
    const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (match) {
      const [, label, url] = match;
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

const QUICK_REPLIES = [
  "J'ai un petit budget (Canva ?)",
  "Je maîtrise Photoshop",
  "Je veux déléguer le design",
  "Je veux mon pack mockup",
];

export function PhaseMockupCreation({ brandId, brand, onComplete, userPlan }: PhaseMockupCreationProps) {
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

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      const saved = localStorage.getItem(`pharell-chat-${brandId}`);
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
      id: 'pharell-intro',
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
        const rawContent = data.reply || `Salut ! Je suis Pharell, ton coach design 👋 Mon rôle est de t'accompagner pas à pas dans la création visuelle de ta collection. Quelle pièce veut-tu designer en premier pour qu'on prépare le bon mockup ? [[Un T-shirt|Un Hoodie|Un Sweatshirt]]`;

        // Extract suggestions
        const suggestMatch = rawContent.match(/\[\[(.*?)\]\]/);
        if (suggestMatch) {
          setSuggestions(suggestMatch[1].split('|'));
        }

        intro.content = rawContent;
        setMessages([{ ...intro }]);
      })
      .catch(() => {
        intro.content = `Salut ! Je suis Pharell, ton coach design 👋 Mon rôle est de t'accompagner de A à Z. Quelle pièce veut-tu designer en premier (t-shirt, hoodie...) ? [[Un T-shirt|Un Hoodie]]`;
        setSuggestions(['Un T-shirt', 'Un Hoodie']);
        setMessages([{ ...intro }]);
      })
      .finally(() => setIsTyping(false));
  }, [brandId]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`pharell-chat-${brandId}`, JSON.stringify(messages));
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
      const rawReply = data.reply || 'Je rencontre un souci technique. Réessaie dans un instant.';

      // Extract suggestions
      const suggestMatch = rawReply.match(/\[\[(.*?)\]\]/);
      if (suggestMatch) {
        setSuggestions(suggestMatch[1].split('|'));
      } else {
        setSuggestions([]);
      }

      const pharellMsg: Message = {
        id: `pharell-${Date.now()}`,
        role: 'assistant',
        content: rawReply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, pharellMsg]);
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

  const userMessagesCount = messages.filter(m => m.role === 'user').length;
  const isFreeLimitReached = userPlan === 'free' && userMessagesCount >= 10;

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F5F7] font-sans relative overflow-hidden flex-1 min-h-0">

      {/* ── Header (Ultra Compact on Mobile) ── */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-black/[0.04] px-4 py-2 sm:py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <Link href="/launch-map" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-[#86868B]" />
          </Link>
          <div className="h-6 w-px bg-black/5 hidden sm:block shrink-0" />
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <img
                src="/images/agents/pharrell_final.png"
                alt="Pharell"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm border border-black/5"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-[#1D1D1F] text-[13px] sm:text-[15px] leading-tight truncate">Pharell</h3>
              <p className="text-[9px] sm:text-[10px] text-[#86868B] font-bold uppercase tracking-wider leading-none mt-0.5">DA OUTFITY</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={onComplete} variant="outline" className="h-8 sm:h-9 text-[10px] sm:text-xs font-bold rounded-xl gap-1.5 px-3 sm:px-4 shadow-sm border-black/10 transition-all active:scale-95">
            <span className="hidden xs:inline">Terminer la phase</span>
            <span className="xs:hidden">Finir</span>
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
                  src="/images/agents/pharrell_final.png"
                  alt="Pharell"
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
            <img
              src="/images/agents/pharrell_final.png"
              alt="Pharell"
              className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full object-cover shadow-sm border border-black/5"
            />
            <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-[18px] sm:rounded-[24px] rounded-bl-[4px] sm:rounded-bl-[8px] bg-white border border-black/[0.05] shadow-sm">
              <div className="flex items-center gap-1.5 h-4">
                <div className="w-1.5 h-1.5 bg-[#86868B]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#86868B]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#86868B]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ── Input Box (Gemini-style Bottom Bar) ── */}
      <div className="w-full shrink-0 bg-[#F5F5F7]/95 backdrop-blur z-20 border-t border-black/[0.03] pt-2 pb-safe-bottom">
        {isFreeLimitReached ? (
          <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-[13px] sm:text-[14px] text-[#1D1D1F] font-medium leading-relaxed max-w-sm mx-auto">
              Tu as atteint ta limite de <b className="font-extrabold text-[#007AFF]">10 messages</b> offerts avec Pharell.
            </p>
            <Link href="/auth/choose-plan" className="w-full max-w-sm shrink-0 rounded-[22px] bg-[#007AFF] hover:bg-[#0056CC] text-white flex items-center justify-center font-bold text-xs sm:text-sm h-11 transition-apple shadow-md active:scale-95">
              Débloquer Mockup Studio
            </Link>
          </div>
        ) : (
          <>
            {suggestions.length > 0 && !isTyping && (
              <div className="flex gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar animate-in slide-in-from-bottom-2 duration-500">
                {suggestions.map(reply => (
                  <button
                    key={reply}
                    onClick={() => {
                      sendMessage(reply);
                      setSuggestions([]);
                    }}
                    className="shrink-0 text-[12px] sm:text-[13px] font-bold text-[#007AFF] bg-white border border-[#007AFF]/15 hover:bg-blue-50 active:bg-blue-100 px-4 py-2 rounded-2xl transition-apple shadow-sm whitespace-nowrap"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            <div className="pb-3 sm:pb-6 px-3 sm:px-6">
              <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-white border border-black/[0.08] rounded-[28px] shadow-apple-lg p-1.5 transition-all focus-within:ring-4 focus-within:ring-[#007AFF]/10 focus-within:border-[#007AFF]/40 z-30 group">
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
                  placeholder="Écrire à Pharell..."
                  className="flex-1 bg-transparent max-h-[120px] min-h-[44px] px-4 py-3 text-[15px] sm:text-[16px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none resize-none leading-relaxed"
                  disabled={isTyping}
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  className="w-11 h-11 shrink-0 rounded-[22px] bg-[#007AFF] hover:bg-[#0056CC] disabled:opacity-30 disabled:hover:bg-[#007AFF] text-white flex items-center justify-center transition-apple m-0.5 shadow-md active:scale-90"
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
