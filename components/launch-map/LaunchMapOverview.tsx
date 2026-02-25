'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  CheckCircle2,
  Palette,
  Target,
  PenTool,
  FileText,
  Truck,
  Store,
  LucideIcon,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { LAUNCH_MAP_PHASES } from '@/lib/launch-map-constants';
import { isFreePlan } from '@/lib/plan-utils';
import type { BrandIdentity, LaunchMapData } from './LaunchMapStepper';
import { PHASE_ICONS } from './PhaseShared';

export interface LaunchMapOverviewProps {
  brand: { id: string; name: string; logo?: string | null };
  launchMap: LaunchMapData | null;
  brandFull: BrandIdentity;
  hasIdentity: boolean;
  designCount: number;
  quoteCount: number;
  ugcCount: number;
  progressPercentage: number;
  suppliers: { id: string; name: string; country: string; moq?: number; leadTime?: number; quoteCount: number }[];
  weekEvents: { id: string; title: string; type: string }[];
  userPlan?: string;
}

const PHASE_HREF: Record<number, string> = {
  0: '/launch-map/phase/0',
  1: '/launch-map/phase/1',
  2: '/launch-map/phase/2',
  3: '/launch-map/tech-packs',
  4: '/launch-map/sourcing',
  5: '/launch-map/phase/5',
};

const PHASE_COLOR: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-violet-50', text: 'text-violet-500', border: 'border-violet-200' },
  1: { bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-200' },
  2: { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-200' },
  3: { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-200' },
  4: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-200' },
  5: { bg: 'bg-[#95BF47]/10', text: 'text-[#5E8E3E]', border: 'border-[#95BF47]/30' },
};

export function LaunchMapOverview({
  brand,
  launchMap,
  brandFull,
  hasIdentity,
  designCount,
  quoteCount,
  suppliers = [],
  progressPercentage,
  userPlan = 'starter',
}: LaunchMapOverviewProps) {
  const phaseProgress: Record<string, boolean> = {
    phase0: hasIdentity,
    phase1: launchMap?.phase1 ?? false,
    phase2: launchMap?.phase2 ?? false,
    phase3: launchMap?.phase3 ?? false,
    phase4: launchMap?.phase4 ?? false,
    phase5: launchMap?.phase5 ?? false,
  };

  const completedCount = Object.values(phaseProgress).filter(Boolean).length;
  const total = LAUNCH_MAP_PHASES.length;
  const isLocked = (phaseId: number) => isFreePlan(userPlan) && ![0, 1, 2, 4].includes(phaseId);
  const nextPhase = LAUNCH_MAP_PHASES.find(p => !phaseProgress[`phase${p.id}`]);

  // Brand color palette
  const colorPalette = brandFull?.colorPalette as Record<string, string> | null | undefined;
  const typography = brandFull?.typography as Record<string, string> | null | undefined;
  const primaryColor = colorPalette?.primary ?? '#007AFF';

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24 sm:pb-12">
      <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* ── Brand Hero Header ── */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] border border-black/[0.06] shadow-apple p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
            {/* Brand Identity */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] border border-black/5 flex items-center justify-center shrink-0 overflow-hidden">
                {brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Sparkles className="w-7 h-7 text-[#86868B]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-[#1D1D1F] leading-none">{brand.name}</h1>
                  {!isFreePlan(userPlan) && (
                    <span className="px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[10px] font-bold uppercase tracking-widest border border-[#007AFF]/20">
                      Créateur
                    </span>
                  )}
                </div>
                <p className="text-[#86868B] text-sm">
                  {completedCount} phase{completedCount !== 1 ? 's' : ''} complétée{completedCount !== 1 ? 's' : ''} sur {total}
                </p>
              </div>
            </div>

            {/* Circular Progress */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-black/5" strokeWidth="7" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                    <circle
                      className="text-[#007AFF]"
                      strokeWidth="7"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={2 * Math.PI * 42 * (1 - progressPercentage / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                      style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#1D1D1F]">{progressPercentage}%</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Avancement</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 pt-6 border-t border-black/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">Parcours de lancement</span>
              <span className="text-[11px] font-semibold text-[#1D1D1F]">{completedCount}/{total}</span>
            </div>
            <div className="flex gap-1">
              {LAUNCH_MAP_PHASES.map((p) => {
                const done = phaseProgress[`phase${p.id}`];
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex-1 h-1.5 rounded-full transition-colors",
                      done ? 'bg-[#007AFF]' : 'bg-black/5'
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          {/* ── LEFT — Phases Grid ── */}
          <div className="md:col-span-2 space-y-6">

            {/* Next step focus */}
            {nextPhase && (
              <div className="relative overflow-hidden bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007AFF]/5 rounded-full blur-[60px] pointer-events-none" />

                {isLocked(nextPhase.id) && (
                  <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-white/90 shadow-xl border border-black/5 rounded-2xl p-5 flex flex-col items-center max-w-[280px] text-center transform hover:scale-105 transition-transform duration-300">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                        <Lock className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="font-bold text-[#1D1D1F] text-sm mb-1">Phase Premium</h3>
                      <p className="text-[11px] text-[#86868B] mb-4">Cette étape nécessite le plan Créateur pour être débloquée.</p>
                      <Link
                        href="/auth/choose-plan"
                        className="w-full bg-[#1D1D1F] hover:bg-black text-white font-bold text-xs rounded-full py-2.5 transition-all"
                      >
                        Débloquer
                      </Link>
                    </div>
                  </div>
                )}

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", PHASE_COLOR[nextPhase.id]?.bg)}>
                      {(() => { const Icon = PHASE_ICONS[nextPhase.id] ?? Palette; return <Icon className={cn("w-6 h-6", PHASE_COLOR[nextPhase.id]?.text)} />; })()}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest mb-0.5">Prochaine étape</p>
                      <h2 className="text-lg font-bold text-[#1D1D1F]">{nextPhase.title}</h2>
                      <p className="text-sm text-[#86868B] truncate max-w-[300px] sm:max-w-md">{nextPhase.subtitle}</p>
                    </div>
                  </div>

                  {!isLocked(nextPhase.id) && (
                    <Link
                      href={PHASE_HREF[nextPhase.id]}
                      className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-[#007AFF] hover:bg-[#0056CC] text-white font-bold text-sm rounded-full px-5 h-10 transition-all active:scale-[0.97] shadow-lg shadow-blue-500/20"
                    >
                      Commencer
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* All phases */}
            <div>
              <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-4 px-1">Toutes les phases</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LAUNCH_MAP_PHASES.map((p) => {
                  const Icon = PHASE_ICONS[p.id] ?? Palette;
                  const done = phaseProgress[`phase${p.id}`];
                  const locked = isLocked(p.id);
                  const color = PHASE_COLOR[p.id];
                  const href = locked ? '/auth/choose-plan' : PHASE_HREF[p.id];

                  return (
                    <Link
                      key={p.id}
                      href={href}
                      className={cn(
                        "group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border transition-all duration-200 hover:shadow-apple active:scale-[0.98]",
                        done
                          ? "bg-white border-[#007AFF]/10 hover:border-[#007AFF]/20 shadow-sm"
                          : locked
                            ? "bg-white border-black/5 opacity-50"
                            : "bg-white border-black/[0.06] hover:border-black/[0.12]"
                      )}
                    >
                      {/* Phase icon */}
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                        done ? "bg-[#007AFF]/10" : color?.bg
                      )}>
                        {done
                          ? <CheckCircle2 className="w-5 h-5 text-[#007AFF]" />
                          : <Icon className={cn("w-5 h-5", color?.text)} />
                        }
                      </div>

                      {/* Phase info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-bold text-sm leading-tight flex items-center gap-2",
                          done ? "text-[#007AFF]" : "text-[#1D1D1F]"
                        )}>
                          {p.title}
                          {locked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                        </p>
                        <p className="text-[11px] text-[#86868B] truncate mt-0.5">{p.subtitle}</p>
                      </div>

                      {/* Status */}
                      <div className="shrink-0 flex items-center justify-center">
                        {done ? (
                          <div className="flex items-center gap-1 text-[9px] font-black text-[#007AFF] uppercase tracking-widest bg-[#007AFF]/5 px-2 py-1 rounded-full border border-[#007AFF]/10">
                            Fait
                          </div>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#C7C7CC] group-hover:text-[#86868B]" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT — Brand Identity + Suppliers ── */}
          <div className="space-y-5">

            {/* Brand Design Identity */}
            {colorPalette && (
              <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#1D1D1F]">Identité visuelle</h3>
                  <Link href="/launch-map/phase/0" className="text-[10px] text-[#007AFF] font-bold uppercase tracking-widest hover:underline">
                    Modifier
                  </Link>
                </div>

                {/* Colors */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Palette</p>
                  <div className="flex gap-2">
                    {(['primary', 'secondary', 'accent'] as const).map(key => {
                      const c = colorPalette[key];
                      if (!c) return null;
                      return (
                        <div key={key} className="flex-1">
                          <div
                            className="h-10 rounded-xl border border-black/5 shadow-inner mb-1"
                            style={{ backgroundColor: c }}
                          />
                          <p className="text-[9px] text-center text-[#86868B] font-mono">{c}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Typography */}
                {typography && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Typographie</p>
                    <div className="space-y-2">
                      {typography.heading && (
                        <div className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-xl">
                          <span className="text-[10px] font-bold text-[#86868B] uppercase">Titres</span>
                          <span className="text-sm font-semibold text-[#1D1D1F]">{typography.heading}</span>
                        </div>
                      )}
                      {typography.body && (
                        <div className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-xl">
                          <span className="text-[10px] font-bold text-[#86868B] uppercase">Corps</span>
                          <span className="text-sm font-semibold text-[#1D1D1F]">{typography.body}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Suppliers */}
            {suppliers.length > 0 && (
              <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#1D1D1F]">Vos fournisseurs</h3>
                  <Link href="/launch-map/sourcing" className="text-[10px] text-[#007AFF] font-bold uppercase tracking-widest hover:underline">
                    Gérer
                  </Link>
                </div>
                <div className="space-y-2">
                  {suppliers.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-2xl">
                      <div>
                        <p className="font-semibold text-sm text-[#1D1D1F]">{s.name}</p>
                        <p className="text-[11px] text-[#86868B]">{s.country}{s.moq ? ` · MOQ ${s.moq}` : ''}{s.leadTime ? ` · ${s.leadTime}j` : ''}</p>
                      </div>
                      {s.quoteCount > 0 && (
                        <span className="text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] px-2 py-1 rounded-full">
                          {s.quoteCount} devis
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upsell for free plan */}
            {isFreePlan(userPlan) && (
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D1D1F] to-[#3a3a3c] p-6 text-white">
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#007AFF]/20 rounded-full blur-[50px]" />
                <div className="relative z-10 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-[#007AFF] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-sm text-white">Déverrouillez tout le parcours</p>
                  <p className="text-white/60 text-xs leading-relaxed">
                    Accédez aux phases Tech Pack, Sourcing et Boutique Shopify.
                  </p>
                  <Link href="/auth/choose-plan" className="flex items-center justify-center gap-2 w-full bg-[#007AFF] hover:bg-[#0056CC] text-white font-bold rounded-full h-10 text-sm shadow-lg shadow-blue-900/30 mt-1 transition-all">
                    Passer au Plan Créateur
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
