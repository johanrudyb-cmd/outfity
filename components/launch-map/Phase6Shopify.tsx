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
    <div className="flex flex-col h-full w-full bg-[#F5F5F7] font-sans relative">

      {/* ── Header ── */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-4 py-1.5 sm:py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/launch-map" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#86868B]" />
          </Link>
          <div className="h-6 w-px bg-black/5 hidden sm:block" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1D1D1F] text-[15px] leading-tight text-[12px] sm:text-[15px]">Johan</h3>
              <p className="text-[11px] text-[#86868B] font-medium text-[8px] sm:text-[11px]">Web designer</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <Link
              href={`https://${shopifyShopDomain}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-full hover:bg-[#007AFF]/20 transition-colors"
            >
              <div className="w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
              {shopifyShopDomain}
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
          {!showConnect && (
            <button
              onClick={() => setShowConnect(true)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-[#1D1D1F] bg-[#E5E5EA] hover:bg-[#D1D1D6] px-3 py-1.5 rounded-full transition-all"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isConnected ? 'Gérer' : 'Lier'}</span>
            </button>
          )}
          <button
            onClick={resetChat}
            className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center hover:bg-[#D1D1D6] transition-colors text-[#1D1D1F]"
            title="Rafraîchir"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Connect Store Panel ── */}
      {showConnect && (
        <div className="bg-white border-b border-black/[0.06] px-4 sm:px-6 py-5 shrink-0 transition-all shadow-sm z-10 relative">
          <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-3 items-end max-w-2xl mx-auto">
            <div className="flex-1 space-y-1.5 w-full">
              <Label className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest pl-1">URL Shopify</Label>
              <Input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="ma-marque.myshopify.com"
                className="h-11 rounded-2xl bg-[#F5F5F7] border-0 text-[14px] focus:ring-1 focus:ring-[#007AFF]"
                disabled={connecting}
              />
            </div>
            <div className="flex-1 space-y-1.5 w-full">
              <div className="flex items-center justify-between pl-1">
                <Label className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Access Token</Label>
                <Link href="https://help.shopify.com/fr/manual/apps/app-types/custom-apps" target="_blank" className="text-[10px] text-[#007AFF] hover:underline">Aide ?</Link>
              </div>
              <Input
                type="password"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="Optionnel"
                className="h-11 rounded-2xl bg-[#F5F5F7] border-0 text-[14px] focus:ring-1 focus:ring-[#007AFF]"
                disabled={connecting}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <Button type="submit" disabled={connecting} className="flex-1 sm:flex-none h-11 px-5 rounded-2xl bg-[#007AFF] hover:bg-[#0056CC] text-white font-bold shadow-md shadow-blue-500/20">
                {connecting ? <AppleLoader size="sm" /> : <span>Valider</span>}
              </Button>
              <button type="button" onClick={() => setShowConnect(false)} className="h-11 px-4 rounded-2xl bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] font-bold transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
          {connectError && <p className="text-[13px] text-red-500 mt-3 font-medium text-center">{connectError}</p>}
        </div>
      )}

      {/* ── Messages Chat UI (iMessage style) ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-4 stylish-scrollbar relative z-0 flex flex-col gap-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={cn("flex items-end gap-2 max-w-[98%] sm:max-w-[95%] md:max-w-[85%] group", isUser ? 'self-end flex-row-reverse' : 'self-start')}>

              {/* Avatar for Johan only */}
              {!isUser && (
                <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={cn(
                  "px-4 py-3 rounded-[24px] text-[15px] leading-relaxed shadow-sm break-words relative",
                  isUser
                    ? "bg-[#007AFF] text-white rounded-br-[8px]"
                    : "bg-white text-[#1D1D1F] border border-black/[0.04] rounded-bl-[8px]"
                )}
              >
                <div className="prose prose-sm max-w-none">
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

        {/* Typing indicator */}
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

      {/* ── Input Box (Docked at bottom) ── */}
      <div className="shrink-0 pt-2 pb-32 sm:pb-6 px-4 sm:px-6 bg-[#F5F5F7] z-20 pb-safe">

        {/* Quick Replies */}
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

        {/* Message Input Pill */}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-white border border-black/[0.08] rounded-[28px] shadow-sm p-1.5 transition-all focus-within:ring-2 focus-within:ring-[#007AFF]/20 focus-within:border-[#007AFF]/50 z-30">
          <textarea
            // @ts-ignore
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize
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

      {/* Basic stylings for scrollbars to keep it clean */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .stylish-scrollbar::-webkit-scrollbar { width: 0px; display: none; }
        .stylish-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
