'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Send, Store, ExternalLink, RefreshCw, ArrowRight, Check, Sparkles, X, ShoppingBag, Loader2, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import type { SiteCreationTodoStep } from '@/lib/api/claude';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { AppleLoader } from '@/components/ui/apple-loader';

interface Phase6ShopifyProps {
  brandId: string;
  brand: {
    id: string;
    name: string;
  } | null;
  shopifyShopDomain: string | null;
  siteCreationTodo?: { steps: SiteCreationTodoStep[] } | null;
  onComplete: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function normalizeShopifyDomain(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '');
    return host.endsWith('.myshopify.com') ? host : host + '.myshopify.com';
  } catch {
    return trimmed.endsWith('.myshopify.com') ? trimmed : trimmed + '.myshopify.com';
  }
}

// Renders markdown-like content with links
function MessageContent({ content, isUser }: { content: string, isUser: boolean }) {
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
          <ShoppingBag className="w-4 h-4" />
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
  "Je n'ai pas de compte",
  "J'ai déjà un compte",
  "Quel plan choisir ?",
  "Où personnaliser mon site ?",
];

export function Phase6Shopify({
  brandId, brand, shopifyShopDomain, onComplete,
}: Phase6ShopifyProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [domain, setDomain] = useState(shopifyShopDomain ?? '');
  const [accessToken, setAccessToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  const isConnected = Boolean(shopifyShopDomain?.trim());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, showConnect]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Load from local storage first
    try {
      const saved = localStorage.getItem(`shopify-chat-${brandId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loaded = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          setMessages(loaded);
          return; // Skip initialization if we have history
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

    fetch('/api/launch-map/shopify-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId,
        messages: [{ role: 'user', content: '__INIT__' }],
      }),
    })
      .then(r => r.json())
      .then(data => {
        intro.content = data.reply || `Salut ! Je suis Johan, ton Web designer 👋 On va créer la boutique de ta marque ensemble. Tu as déjà un compte Shopify ?`;
        setMessages([{ ...intro }]);
      })
      .catch(() => {
        intro.content = `Salut ! Je suis Johan, ton Web designer 👋 Je suis là pour t'aider à lancer la boutique de ta marque étape par étape. Par où on commence ?`;
        setMessages([{ ...intro }]);
      })
      .finally(() => setIsTyping(false));
  }, [brandId]);

  // Save to local storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`shopify-chat-${brandId}`, JSON.stringify(messages));
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
      const res = await fetch('/api/launch-map/shopify-chat', {
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

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeShopifyDomain(domain);
    if (!normalized) { setConnectError('Saisis l\'URL de ta boutique'); return; }
    setConnectError('');
    setConnecting(true);
    try {
      const res = await fetch('/api/launch-map/shopify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, shopifyShopDomain: normalized, shopifyAccessToken: accessToken.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setConnectError(data.error || 'Erreur de connexion'); return; }
      toast({ title: 'Boutique connectée ! 🎉', message: 'Shopify est maintenant lié à ta marque.' });
      onComplete();
      setShowConnect(false);
      sendMessage(`Ma boutique est connectée : ${normalized}`);
    } finally { setConnecting(false); }
  }

  const resetChat = () => {
    localStorage.removeItem(`shopify-chat-${brandId}`);
    hasInitialized.current = false;
    setMessages([]);
    setIsTyping(true);
    fetch('/api/launch-map/shopify-chat', {
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
    <div className="flex flex-col h-full w-full bg-[#F5F5F7] font-sans relative overflow-hidden flex-1 min-h-0">

      {/* ── Header ── */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-black/[0.1] px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <Link href="/launch-map" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-[#86868B]" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#95BF47] to-[#5E8E3E] flex items-center justify-center shadow-sm text-white">
                <Store className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-[#1D1D1F] text-[13px] sm:text-[15px] leading-tight truncate">Shopify Assist</h3>
              <p className="text-[9px] sm:text-[10px] text-[#86868B] font-bold uppercase tracking-wider leading-none mt-0.5">Lancement E-shop</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!showConnect && (
            <button
              onClick={() => setShowConnect(true)}
              className={cn(
                "h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-apple shadow-sm",
                isConnected ? "bg-white border border-black/5 text-[#5E8E3E]" : "bg-black text-white hover:bg-black/80"
              )}
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isConnected ? 'Gérer' : 'Lier'}</span>
            </button>
          )}
          <Button
            onClick={onComplete}
            className="h-8 sm:h-9 text-[10px] sm:text-xs font-bold rounded-xl gap-1.5 px-3 sm:px-4 bg-[#5E8E3E] hover:bg-[#4A7231] text-white shadow-sm transition-apple"
          >
            <span className="hidden xs:inline">Terminer</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
                <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-gradient-to-br from-[#95BF47] to-[#5E8E3E] flex items-center justify-center shadow-sm text-white mb-0.5">
                  <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              )}
              <div
                className={cn(
                  "px-3.5 py-2 sm:px-4 sm:py-3 rounded-[18px] sm:rounded-[24px] text-[14px] sm:text-[15px] leading-relaxed shadow-sm break-words relative transition-apple",
                  isUser
                    ? "bg-[#5E8E3E] text-white rounded-br-[4px] sm:rounded-br-[8px]"
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
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2 self-start max-w-[85%] sm:max-w-[75%]">
            <div className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-gradient-to-br from-[#95BF47] to-[#5E8E3E] flex items-center justify-center shadow-sm text-white mb-0.5">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-[18px] sm:rounded-[24px] rounded-bl-[4px] sm:rounded-bl-[8px] bg-white border border-black/[0.05] shadow-sm">
              <div className="flex items-center gap-1.5 h-4">
                <div className="w-1.5 h-1.5 bg-[#95BF47]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#95BF47]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#95BF47]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {showConnect && (
          <div className="self-center w-full max-w-sm my-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[28px] border border-black/[0.08] shadow-apple-lg p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#95BF47]/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-[#5E8E3E]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1D1D1F]">Connecter Shopify</h4>
                  <p className="text-xs text-[#86868B]">Reliez votre boutique existante</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-black/30">Domaine .myshopify.com</Label>
                  <Input
                    placeholder="ma-boutique.myshopify.com"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    className="h-12 rounded-xl border-black/[0.08] focus:ring-[#95BF47]/10 focus:border-[#95BF47]/40 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-black/30">Access Token (Admin API)</Label>
                  <Input
                    type="password"
                    placeholder="shpat_xxxxxxxxxxxxxxxx"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    className="h-12 rounded-xl border-black/[0.08] focus:ring-[#95BF47]/10 focus:border-[#95BF47]/40 font-medium"
                  />
                </div>
                {connectError && <p className="text-xs font-bold text-rose-500 px-1 italic">! {connectError}</p>}
                <Button
                  onClick={handleConnect}
                  disabled={connecting || !domain || !accessToken}
                  className="w-full h-12 rounded-xl bg-[#5E8E3E] hover:bg-[#4A7231] text-white font-bold shadow-sm transition-apple"
                >
                  {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lancer la synchronisation'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowConnect(false)}
                  className="w-full h-10 rounded-xl text-xs font-bold text-[#86868B] hover:text-[#1D1D1F]"
                >
                  Plus tard
                </Button>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ── Input Box (Gemini-style) ── */}
      <div className="shrink-0 pt-2 bg-[#F5F5F7] z-20 border-t border-black/[0.05] px-3 sm:px-6 pb-safe-bottom">
        {QUICK_REPLIES.length > 0 && !isTyping && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-1 animate-in slide-in-from-bottom-2 duration-500">
            {QUICK_REPLIES.map(reply => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="shrink-0 text-[12px] sm:text-[13px] font-bold text-[#5E8E3E] bg-white border border-[#95BF47]/20 hover:bg-[#95BF47]/5 active:bg-[#95BF47]/10 px-4 py-2.5 rounded-2xl transition-apple shadow-sm whitespace-nowrap"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div className="pb-3 sm:pb-6">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-white border border-black/[0.08] rounded-[28px] shadow-apple-lg p-1.5 transition-all focus-within:ring-4 focus-within:ring-[#95BF47]/10 focus-within:border-[#95BF47]/30 z-30">
            <textarea
              ref={inputRef as any}
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
              placeholder="Parler à Shopify Assist..."
              className="flex-1 bg-transparent max-h-[120px] min-h-[44px] px-4 py-3 text-[15px] sm:text-[16px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none resize-none leading-relaxed"
              disabled={isTyping}
              rows={1}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="w-11 h-11 shrink-0 rounded-[22px] bg-[#5E8E3E] hover:bg-[#4A7231] disabled:opacity-30 disabled:hover:bg-[#5E8E3E] text-white flex items-center justify-center transition-apple m-0.5 shadow-md active:scale-95"
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </form>
        </div>
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
