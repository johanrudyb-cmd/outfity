'use client';

import { useState } from 'react';
import { VirtualTryOn } from './VirtualTryOn';
import { StructuredPostCreator } from './StructuredPostCreator';
import { ShootingPhoto } from './ShootingPhoto';
import { LogoGenerator } from './LogoGenerator';
import {
  LayoutList,
  Image as ImageIcon,
  Camera,
  Sparkles,
  PenTool,
  Zap,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FeatureUsageBadge } from '@/components/usage/FeatureUsageBadge';
import { isFreePlan } from '@/lib/plan-utils';

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
  colorPalette?: Record<string, string> | null;
}

interface UGCLabProps {
  brandId: string;
  brandName: string;
  designs?: Design[];
  brand?: Brand;
  userPlan?: string;
}

type Tab = 'tryon' | 'shooting' | 'scripts' | 'logo';

const TABS = [
  {
    id: 'shooting' as Tab,
    label: 'Shooting Photo',
    sublabel: 'Mettez vos produits en scène avec l\'IA',
    icon: Camera,
    badge: null,
    color: 'from-[#34C759] to-[#30D158]',
    bgColor: 'bg-[#34C759]/10',
    activeColor: 'border-[#34C759] text-[#34C759]',
  },
  {
    id: 'tryon' as Tab,
    label: 'Virtual Try-On',
    sublabel: 'Visualisez vos pièces sur mannequin IA',
    icon: ImageIcon,
    badge: 'PREMIUM',
    color: 'from-[#FF9500] to-[#FF6000]',
    bgColor: 'bg-[#FF9500]/10',
    activeColor: 'border-[#FF9500] text-[#FF9500]',
  },
  {
    id: 'logo' as Tab,
    label: 'Identité Visuelle',
    sublabel: 'Générez votre logo et charte graphique',
    icon: PenTool,
    badge: null,
    color: 'from-[#AF52DE] to-[#9034C7]',
    bgColor: 'bg-[#AF52DE]/10',
    activeColor: 'border-[#AF52DE] text-[#AF52DE]',
  },
  {
    id: 'scripts' as Tab,
    label: 'Scripts Marketing',
    sublabel: 'Posts Instagram, TikTok & Reels structurés',
    icon: LayoutList,
    badge: null,
    color: 'from-[#007AFF] to-[#0056CC]',
    bgColor: 'bg-[#007AFF]/10',
    activeColor: 'border-[#007AFF] text-[#007AFF]',
  },
] as const;

export function UGCLab({ brandId, brandName, designs = [], brand, userPlan = 'free' }: UGCLabProps) {
  const [activeTab, setActiveTab] = useState<Tab>('shooting');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | undefined>();

  const activeTabData = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-4 sm:space-y-8">

      {/* ── Tab Navigation : Cards cliquables ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative group text-left p-3 sm:p-5 rounded-[18px] sm:rounded-[24px] border-2 transition-all duration-200 overflow-hidden',
                isActive
                  ? `${tab.bgColor} ${tab.activeColor} shadow-lg`
                  : 'bg-white border-black/[0.06] hover:border-black/20 hover:shadow-md',
              )}
            >
              {/* Active indicator */}
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
                      <span className="text-[8px] sm:text-[9px] font-black bg-[#FF9500]/15 text-[#FF9500] px-1.5 py-0.5 rounded-full hidden sm:inline">{tab.badge}</span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#86868B] leading-snug hidden md:block">{tab.sublabel}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Content Zone ── */}
      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-black/[0.06] shadow-apple overflow-hidden">
        {/* Header avec usage badge */}
        <div className={cn("px-4 sm:px-8 py-4 sm:py-5 border-b border-black/5 flex items-center justify-between", activeTabData.bgColor.replace('/10', '/5'))}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center", activeTabData.bgColor)}>
              <activeTabData.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
            </div>
            <div>
              <h2 className="text-[13px] sm:text-[15px] font-bold text-[#1D1D1F]">{activeTabData.label}</h2>
              <p className="text-[10px] sm:text-[11px] text-[#86868B] hidden sm:block">{activeTabData.sublabel}</p>
            </div>
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
            {activeTab === 'logo' && (
              <FeatureUsageBadge featureKey="brand_logo" isFree={isFreePlan(userPlan)} />
            )}
            {activeTab === 'scripts' && (
              <FeatureUsageBadge featureKey="ugc_scripts" isFree={isFreePlan(userPlan)} />
            )}
          </div>
        </div>

        {/* Tool area */}
        <div className="relative p-4 sm:p-6 lg:p-8">
          {/* Shadow State Overlay for Free Plan */}
          {isFreePlan(userPlan) && (
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

          {/* Actual Tools (Blurred if Free) */}
          <div className={cn(isFreePlan(userPlan) && "opacity-40 pointer-events-none select-none blur-[2px]")}>
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
                onSwitchToTryOn={() => setActiveTab('tryon')}
                onSelectImage={(url) => {
                  setSelectedImageUrl(url);
                  setActiveTab('scripts');
                }}
              />
            )}

            {activeTab === 'logo' && (
              <LogoGenerator brandId={brandId} />
            )}

            {activeTab === 'scripts' && (
              <StructuredPostCreator
                brandId={brandId}
                brandName={brandName}
                initialImageUrl={selectedImageUrl}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
