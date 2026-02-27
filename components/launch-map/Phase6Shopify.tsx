'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import type { SiteCreationTodoStep } from '@/lib/api/claude';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { BaseAgentChat } from './BaseAgentChat';

interface Phase6ShopifyProps {
  brandId: string;
  brand: { id: string; name: string; } | null;
  shopifyShopDomain: string | null;
  siteCreationTodo?: { steps: SiteCreationTodoStep[] } | null;
  onComplete: () => void;
  userPlan?: string;
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

export function Phase6Shopify({ brandId, brand, shopifyShopDomain, onComplete, userPlan = 'free' }: Phase6ShopifyProps) {
  const { toast } = useToast();
  const [showConnect, setShowConnect] = useState(false);
  const [domain, setDomain] = useState(shopifyShopDomain ?? '');
  const [accessToken, setAccessToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const isConnected = Boolean(shopifyShopDomain?.trim());

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeShopifyDomain(domain);
    if (!normalized) { setConnectError("Saisis l'URL de ta boutique"); return; }
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
    } finally { setConnecting(false); }
  };

  const renderMessageContent = (content: string, isUser: boolean) => {
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return (
      <div className="leading-relaxed text-[15px]">
        {parts.map((part, i) => {
          const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
          if (match) {
            const [, label, url] = match;
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className={cn("inline-flex items-center gap-2 mt-3 mb-1 font-bold text-[13px] px-5 py-2.5 rounded-2xl transition-all no-underline shadow-sm",
                  isUser ? "bg-[#5E8E3E] text-white" : "bg-[#5E8E3E] text-white hover:bg-[#4A7231]"
                )}>
                <ShoppingBag className="w-4 h-4" />{label}<ArrowRight className="w-4 h-4" />
              </a>
            );
          }
          return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
        })}
      </div>
    );
  };

  const headerActions = undefined;

  const customViews = showConnect ? (
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
  ) : null;

  return (
    <BaseAgentChat
      brandId={brandId}
      userPlan={userPlan}
      agentName="Johan"
      agentRole="Lancement E-shop"
      agentImage="/images/agents/johan_final.png"
      themeColor="bg-[#5E8E3E]"
      themeHoverColor="hover:bg-[#4A7231]"
      themeTextColor="text-[#5E8E3E]"
      themeGradient="from-[#95BF47] to-[#5E8E3E]"
      agentIcon={Store}
      apiEndpoint="/api/launch-map/shopify-chat"
      storageKey="johan"
      welcomeTitle="Créez votre boutique"
      welcomeDescription={<>Je suis <b>Johan</b>, ton Web Designer. Je t'aide à configurer Shopify, choisir un thème et optimiser ton site pour convertir au maximum.</>}
      welcomePrompts={[
        "Je n'ai pas encore de compte Shopify",
        "Comment personnaliser mon thème ?",
        "Je dois ajouter mes produits / mockups",
        "Comment optimiser mon taux de conversion ?"
      ]}
      welcomeIcons={
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-40">
          <div className="flex items-center gap-2"><Store className="w-5 h-5" /><span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Expert Shopify</span></div>
        </div>
      }
      renderMessageContent={renderMessageContent}
      headerActions={headerActions}
      customViews={customViews}
      hideChatWhenCustomView={true}
      onComplete={onComplete}
      upgradeLinkText="Débloquer E-shop Builder"
    />
  );
}
