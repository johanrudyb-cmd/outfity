'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  LayoutList,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FeatureUsageBadge } from '@/components/usage/FeatureUsageBadge';
import { isFreePlan } from '@/lib/plan-utils';

const JoyChat = dynamic(
  () => import('./JoyChat').then((mod) => mod.JoyChat),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-[#86868B]">
        Chargement de Joy...
      </div>
    ),
  }
);

const VirtualTryOn = dynamic(
  () => import('./VirtualTryOn').then((mod) => mod.VirtualTryOn),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center text-sm text-[#86868B]">
        Chargement du Try-On...
      </div>
    ),
  }
);

const ShootingPhoto = dynamic(
  () => import('./ShootingPhoto').then((mod) => mod.ShootingPhoto),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center text-sm text-[#86868B]">
        Chargement du studio photo...
      </div>
    ),
  }
);

interface Design {
  id: string;
  type: string;
  flatSketchUrl: string | null;
  productImageUrl?: string | null;
  templateName?: string | null;
}

interface Brand {
  id: string;
  name: string;
  logo?: string | null;
  colorPalette?: any;
  typography?: any;
  styleGuide?: any;
}

interface UGCLabProps {
  brandId: string;
  brandName: string;
  designs?: Design[];
  brand?: Brand;
  userPlan?: string;
}

type Tab = 'tryon' | 'shooting' | 'scripts';

const TABS = [
  {
    id: 'shooting' as Tab,
    label: 'Shooting Photo',
    sublabel: 'Mettez vos produits en scène avec l\'IA',
    icon: Camera,
    badge: 'BIENTÔT',
    color: 'from-[#34C759] to-[#30D158]',
    bgColor: 'bg-[#34C759]/10',
    activeColor: 'border-[#34C759] text-[#34C759]',
    unavailable: true,
  },
  {
    id: 'tryon' as Tab,
    label: 'Virtual Try-On',
    sublabel: 'Visualisez vos pièces sur mannequin IA',
    icon: ImageIcon,
    badge: 'BIENTÔT',
    color: 'from-[#FF9500] to-[#FF6000]',
    bgColor: 'bg-[#FF9500]/10',
    activeColor: 'border-[#FF9500] text-[#FF9500]',
    unavailable: true,
  },
  {
    id: 'scripts' as Tab,
    label: 'JOY (Contenu)',
    sublabel: 'Posts Instagram, TikTok & Reels structurés',
    icon: Sparkles,
    badge: 'ACTIF',
    color: 'from-[#007AFF] to-[#0056CC]',
    bgColor: 'bg-[#007AFF]/10',
    activeColor: 'border-[#007AFF] text-[#007AFF]',
    unavailable: false,
  },
] as const;

export function UGCLab({ brandId, brandName, designs = [], brand, userPlan = 'free' }: UGCLabProps) {
  const [activeTab, setActiveTab] = useState<Tab | 'menu'>('menu');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | undefined>();

  const isScripts = activeTab === 'scripts';
  const activeTabData = activeTab !== 'menu' ? TABS.find(t => t.id === activeTab) : null;

  // ── Joy Chat Immersive Mode (True Full Screen) ──
  if (isScripts) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#F5F5F7] overflow-hidden flex flex-col relative">
        {isFreePlan(userPlan) && (
          <div className="absolute inset-0 z-[10000] backdrop-blur-md bg-white/40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-black rounded-[28px] flex items-center justify-center mb-6 shadow-2xl">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-black text-black mb-3 uppercase tracking-tight">Accès Joy Verrouillé</h3>
            <p className="text-[#86868B] max-w-sm mb-8 font-medium">
              L'expertise de Joy pour vos contenus viraux et scripts marketing est réservée au <strong>Plan Créateur</strong>.
            </p>
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => setActiveTab('menu')}
                variant="outline"
                className="h-14 px-10 rounded-full font-bold text-sm uppercase tracking-widest border-2"
              >
                Retourner au Studio
              </Button>
              <Link href="/auth/choose-plan">
                <Button className="h-14 px-10 bg-[#007AFF] hover:bg-[#0056CC] text-white rounded-full font-bold text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                  Passer au Plan Créateur <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
        <div className={cn("flex-1 flex flex-col min-h-0", isFreePlan(userPlan) && "opacity-20 grayscale select-none pointer-events-none")}>
          <JoyChat
            brandId={brandId}
            brandName={brandName}
            initialImageUrl={selectedImageUrl}
            userPlan={userPlan}
            onBack={() => setActiveTab('menu')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">

      {/* ── Page Header ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">
              UGC Lab
            </h1>
            <p className="text-muted-foreground text-sm">
              Créez votre contenu marketing viral avec l'IA
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      {!isScripts && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.unavailable) return;
                  setActiveTab(tab.id);
                }}
                className={cn(
                  'relative group text-left p-3 sm:p-5 rounded-[18px] sm:rounded-[24px] border-2 transition-all duration-200 overflow-hidden',
                  isActive
                    ? `${tab.bgColor} ${tab.activeColor} shadow-lg`
                    : 'bg-white border-black/[0.06] hover:border-black/20 hover:shadow-md',
                  tab.unavailable && 'opacity-60 grayscale cursor-not-allowed hover:border-black/[0.06] hover:shadow-none'
                )}
              >
                {isActive && (
                  <div className={cn("absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-30 bg-gradient-to-br", tab.color)} />
                )}

                <div className="relative space-y-2 sm:space-y-3">
                  <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all", isActive ? tab.bgColor : "bg-[#F5F5F7]")}>
                    <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-colors", isActive ? "text-current" : "text-[#86868B]")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                      <p className={cn("text-[12px] sm:text-[13px] font-bold leading-tight", isActive ? "text-current" : "text-[#1D1D1F]")}>{tab.label}</p>
                      {tab.badge && (
                        <span className={cn(
                          "text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full hidden sm:inline",
                          tab.unavailable ? "bg-black/5 text-[#86868B]" : "bg-[#007AFF]/15 text-[#007AFF]"
                        )}>
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[#86868B] leading-snug hidden md:block">
                      {tab.unavailable ? 'Momentanément indisponible' : tab.sublabel}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content Zone ── */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        !isScripts ? "bg-white rounded-[24px] sm:rounded-[32px] border border-black/[0.06] shadow-apple overflow-hidden" : "bg-[#F5F5F7]"
      )}>

        {/* Header with Usage Badge (Only for Try-On and Shooting) */}
        {!isScripts && activeTab !== 'menu' && (
          <div className={cn("px-4 sm:px-8 py-4 sm:py-5 border-b border-black/5 flex items-center justify-between shrink-0", activeTabData?.bgColor.replace('/10', '/5'))}>
            <div className="flex items-center gap-2 sm:gap-3">
              {activeTabData && (
                <>
                  <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center", activeTabData.bgColor)}>
                    <activeTabData.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
                  </div>
                  <div>
                    <h2 className="text-[13px] sm:text-[15px] font-bold text-[#1D1D1F]">{activeTabData.label}</h2>
                    <p className="text-[10px] sm:text-[11px] text-[#86868B] hidden sm:block">{activeTabData.sublabel}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {activeTab === 'tryon' && (
                <>
                  <FeatureUsageBadge featureKey="ugc_virtual_tryon" isFree={isFreePlan(userPlan)} />
                  <Link href="/usage" className="text-[10px] font-bold text-[#FF9500] underline hover:no-underline hidden sm:inline">Crédits</Link>
                </>
              )}
              {activeTab === 'shooting' && (
                <FeatureUsageBadge featureKey="ugc_shooting_photo" isFree={isFreePlan(userPlan)} />
              )}
            </div>
          </div>
        )}

        {/* Tool Area */}
        <div className={cn("relative flex-1 flex flex-col min-h-0", isScripts ? "h-full w-full" : "p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar bg-white rounded-[24px] sm:rounded-[32px] border border-black/5 shadow-sm")}>
          {/* Shadow Overlay for Free Plan (Only for Try-On and Shooting) */}
          {isFreePlan(userPlan) && !isScripts && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[4px] rounded-b-[24px] sm:rounded-b-[32px]">
              <div className="bg-white p-6 sm:p-8 rounded-[20px] sm:rounded-[24px] shadow-2xl border border-black/10 text-center max-w-sm space-y-5 mx-4 transform translate-y-[-5%] transition-all">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-black to-zinc-800 flex items-center justify-center mx-auto shadow-lg">
                  <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] sm:text-[17px] font-black text-[#1D1D1F] mb-1.5">Aperçu du Studio IA</h3>
                  <p className="text-[12px] sm:text-[13px] text-[#86868B] leading-relaxed">
                    Vous visualisez l'interface en mode restreint. Le <strong className="text-[#1D1D1F]">plan Créateur</strong> débloque tous les outils d'IA.
                  </p>
                </div>
                <Link
                  href="/auth/choose-plan"
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-full font-bold bg-[#007AFF] hover:bg-[#007AFF]/90 text-white h-11 sm:h-12 text-[13px] sm:text-[14px] transition-all shadow-md shadow-[#007AFF]/20"
                >
                  <Zap className="w-4 h-4" />
                  Débloquer les Outils
                </Link>
              </div>
            </div>
          )}

          {/* Actual Tools */}
          <div className={cn("flex-1 flex flex-col min-h-0", (isFreePlan(userPlan)) && "opacity-40 pointer-events-none select-none blur-[2px]")}>
            {activeTab === 'menu' && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-[#F5F5F7] flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-[#007AFF]/20" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1D1D1F]">Sélectionnez un outil</h3>
                  <p className="text-[#86868B] text-sm max-w-xs mx-auto">Choisissez l'expertise dont vous avez besoin pour vos visuels ou votre contenu.</p>
                </div>
              </div>
            )}

            {activeTab === 'tryon' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-[#FF9500]/5 border border-[#FF9500]/15 rounded-xl sm:rounded-2xl">
                  <Sparkles className="w-4 h-4 text-[#FF9500] shrink-0 mt-0.5" />
                  <p className="text-[11px] sm:text-[12px] text-[#1D1D1F]">
                    Le Virtual Try-On est un outil premium : <strong>7,90€ par essai</strong>. Vos crédits sont disponibles dans le tableau de bord.
                  </p>
                </div>
                <VirtualTryOn
                  brandId={brandId}
                  designs={designs}
                  userPlan={userPlan}
                  onSelectImage={(url) => {
                    setSelectedImageUrl(url);
                    setActiveTab('scripts');
                  }}
                />
              </div>
            )}

            {activeTab === 'shooting' && (
              <ShootingPhoto
                brandId={brandId}
                designs={designs}
                userPlan={userPlan}
                onSwitchToTryOn={() => setActiveTab('tryon')}
                onSelectImage={(url) => {
                  setSelectedImageUrl(url);
                  setActiveTab('scripts');
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
