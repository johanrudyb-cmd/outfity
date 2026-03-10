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

import useSWR from 'swr';

export interface LaunchMapOverviewProps {
  _unused?: never;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PHASE_HREF: Record<number, string> = {
  0: '/launch-map/phase/0',
  1: '/launch-map/phase/1',
  2: '/launch-map/phase/2',
  3: '/launch-map/phase/3',
  4: '/launch-map/phase/4',
  5: '/launch-map/phase/5',
  6: '/launch-map/tech-packs',
  7: '/launch-map/sourcing',
  8: '/launch-map/phase/8',
};

const PHASE_COLOR: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-violet-50', text: 'text-violet-500', border: 'border-violet-200' },
  1: { bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-200' },
  2: { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-200' },
  3: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  4: { bg: 'bg-[#ff327e]/10', text: 'text-[#ff327e]', border: 'border-[#ff327e]/20' },
  5: { bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-200' },
  6: { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-200' },
  7: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-200' },
  8: { bg: 'bg-[#95BF47]/10', text: 'text-[#5E8E3E]', border: 'border-[#95BF47]/30' },
};

import { FeatureTourModal } from '@/components/ui/feature-tour-modal';

export function LaunchMapOverview() {
  const { data, isLoading } = useSWR('/api/launch-map/summary', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const brand = data?.brand ?? { id: '', name: 'Chargement...', logo: null };
  const launchMap = data?.launchMap ?? null;
  const brandFull = data?.brandFull ?? null;
  const hasIdentity = data?.hasIdentity ?? false;
  const designCount: number = data?.designCount ?? 0;
  const quoteCount: number = data?.quoteCount ?? 0;
  const suppliers: { id: string; name: string; country: string; moq?: number; leadTime?: number; quoteCount: number }[] = data?.suppliers ?? [];
  const progressPercentage: number = data?.progressPercentage ?? 0;
  const waitlistLeadCount: number = data?.waitlistLeadCount ?? 0;
  const userPlan = data?.userPlan ?? 'starter';
  const phaseProgress: Record<string, boolean> = {
    phase0: hasIdentity,
    phase1: launchMap?.phase1 ?? false,
    phase2: launchMap?.phase2 ?? false,
    phase3: launchMap?.phase3 ?? false,
    phase4: launchMap?.phase4 ?? false,
    phase5: launchMap?.phase5 ?? false,
    phase6: launchMap?.phase6 ?? false,
    phase7: launchMap?.phase7 ?? false,
    phase8: launchMap?.phase8 ?? false,
  };

  const completedCount = Object.values(phaseProgress).filter(Boolean).length;
  const total = LAUNCH_MAP_PHASES.length;

  const isLocked = (phaseId: number) => {
    // Plan lock
    if (isFreePlan(userPlan) && ![0, 1].includes(phaseId)) return true;

    // Market lock (Prerequisite)
    const waitlistGoal = 100;
    const waitlistMet = waitlistLeadCount >= waitlistGoal || phaseProgress.phase5;

    if ([6, 7, 8].includes(phaseId) && !waitlistMet) return true;

    return false;
  };

  const nextPhase = LAUNCH_MAP_PHASES.find(p => !phaseProgress[`phase${p.id}`]);

  // Brand color palette
  const colorPalette = brandFull?.colorPalette as Record<string, string> | null | undefined;
  const typography = brandFull?.typography as Record<string, string> | null | undefined;
  const primaryColor = colorPalette?.primary ?? '#007AFF';

  return (
    <div className="bg-[#F5F5F7] pb-32 sm:pb-16 flex-1 relative">
      <FeatureTourModal
        featureKey="launch_map_intro"
        title="Gérez votre marque de A à Z"
        icon={<Target className="w-6 h-6 text-primary" />}
        description={
          <div className="space-y-4">
            <p>
              Bienvenue dans le <strong>Parcours de Lancement</strong>. Vous voici dans le cockpit de votre projet de mode ou de créateur.
            </p>
            <p>
              Plutôt que d'avancer à l'aveuglette, OUTFITY a découpé la création de votre collection en étapes claires et validées par l'industrie.
            </p>
          </div>
        }
        bulletPoints={[
          "Créez ou modifiez votre univers de marque et votre logo (Étape 1).",
          "Générez des designs 3D ultra-réalistes (Étape 2).",
          "Trouvez des fournisseurs vérifiés et exportez vos fiches techniques.",
          "Suivez pas-à-pas la progression jusqu'au lancement de votre site."
        ]}
        ctaText="Découvrir mon parcours"
      />

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">

          {/* ── LEFT — Phases Grid ── */}
          <div className="md:col-span-2 space-y-6">


            {/* All phases */}
            <div>
              <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-4 px-1">Toutes les phases</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LAUNCH_MAP_PHASES.map((p, index) => {
                  const Icon = PHASE_ICONS[p.id] ?? Palette;
                  const done = phaseProgress[`phase${p.id}`];
                  const locked = isLocked(p.id);
                  const isNext = nextPhase?.id === p.id;
                  const color = PHASE_COLOR[p.id];
                  const href = locked ? '/auth/choose-plan' : PHASE_HREF[p.id];

                  return (
                    <Link
                      key={p.id}
                      href={href}
                      prefetch={true}
                      className={cn(
                        "group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border transition-all duration-200 hover:shadow-apple active:scale-[0.98] overflow-hidden",
                        done
                          ? "bg-white border-[#007AFF]/10 hover:border-[#007AFF]/20 shadow-sm"
                          : isNext
                            ? "bg-gradient-to-br from-[#007AFF]/[0.06] to-[#007AFF]/[0.02] border-[#007AFF]/20 shadow-md shadow-blue-500/10 ring-1 ring-[#007AFF]/10"
                            : locked
                              ? "bg-white border-black/5 opacity-50"
                              : "bg-white border-black/[0.06] hover:border-black/[0.12]"
                      )}
                    >
                      {/* Pulsing ring for next phase */}
                      {isNext && (
                        <span className="absolute top-3 right-3">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-50" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#007AFF]" />
                          </span>
                        </span>
                      )}

                      {/* Phase icon */}
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                        done ? "bg-[#007AFF]/10" : isNext ? "bg-[#007AFF]/10" : color?.bg
                      )}>
                        {done
                          ? <CheckCircle2 className="w-5 h-5 text-[#007AFF]" />
                          : <Icon className={cn("w-5 h-5", isNext ? "text-[#007AFF]" : color?.text)} />
                        }
                      </div>

                      {/* Phase info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-[#86868B] uppercase tracking-widest mb-0.5">
                          {isNext ? (
                            <span className="text-[#007AFF]">→ À faire maintenant</span>
                          ) : (
                            `Étape ${index + 1}`
                          )}
                        </p>
                        <p className={cn(
                          "font-bold text-sm leading-tight flex items-center gap-2",
                          done ? "text-[#007AFF]" : isNext ? "text-[#1D1D1F]" : "text-[#1D1D1F]"
                        )}>
                          {p.title}
                          {locked && (
                            <div className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-500" />
                              {([6, 7, 8].includes(p.id) && waitlistLeadCount < 100) && (
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Market Lock</span>
                              )}
                            </div>
                          )}
                        </p>
                        <p className="text-[11px] text-[#86868B] truncate mt-0.5">{p.subtitle}</p>
                      </div>

                      {/* Status / CTA */}
                      <div className="shrink-0 flex items-center justify-center">
                        {done ? (
                          <div className="flex items-center gap-1 text-[9px] font-black text-[#007AFF] uppercase tracking-widest bg-[#007AFF]/5 px-2 py-1 rounded-full border border-[#007AFF]/10">
                            Fait
                          </div>
                        ) : isNext && !locked ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#007AFF] px-3 py-1.5 rounded-full shadow-sm shadow-blue-500/30 whitespace-nowrap">
                            Commencer
                            <ArrowRight className="w-3 h-3" />
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
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Couleurs</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {(['primary', 'secondary', 'accent'] as const).map(key => {
                      const c = colorPalette[key];
                      if (!c) return null;
                      return (
                        <div key={key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-black/5 bg-[#F5F5F7]">
                          <div
                            className="w-4 h-4 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-black/10"
                            style={{ backgroundColor: c }}
                          />
                          <span className="text-[10px] font-medium text-[#1D1D1F] font-mono uppercase">{c}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Typography */}
                {typography && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Typographie</p>
                    <div className="grid grid-cols-2 gap-2">
                      {typography.heading && (
                        <div className="p-3 bg-[#F5F5F7] rounded-2xl border border-black/5">
                          <p className="text-[9px] font-bold text-[#86868B] uppercase tracking-widest mb-1.5">Titres</p>
                          <p className="text-xl font-bold text-[#1D1D1F] leading-none" style={{ fontFamily: typography.heading }}>Aa</p>
                          <p className="text-[10px] font-medium text-[#1D1D1F] mt-1">{typography.heading}</p>
                        </div>
                      )}
                      {typography.body && (
                        <div className="p-3 bg-[#F5F5F7] rounded-2xl border border-black/5">
                          <p className="text-[9px] font-bold text-[#86868B] uppercase tracking-widest mb-1.5">Corps</p>
                          <p className="text-xl text-[#1D1D1F] leading-none" style={{ fontFamily: typography.body }}>Aa</p>
                          <p className="text-[10px] font-medium text-[#86868B] mt-1 truncate">{typography.body}</p>
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

            {/* Upsell for free plan — Agent-centric */}
            {isFreePlan(userPlan) && (
              <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D1D1F] to-[#3a3a3c] p-6 text-white">
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#007AFF]/20 rounded-full blur-[50px]" />
                <div className="relative z-10 space-y-4">
                  <p className="font-bold text-sm text-white">Débloque toute ton équipe</p>
                  <div className="flex items-center gap-2">
                    {[
                      { name: 'Pharrell', img: '/images/agents/pharrell_final.webp' },
                      { name: 'Ada', img: '/images/agents/ada_final.webp' },
                      { name: 'Joy', img: '/images/agents/joy_final.webp' },
                      { name: 'Johan', img: '/images/agents/johan_final.webp' },
                    ].map(a => (
                      <div key={a.name} className="relative group/a">
                        <img src={a.img} alt={a.name} className="w-9 h-9 rounded-full object-cover border-2 border-white/20 grayscale opacity-60" />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover/a:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {a.name}
                        </div>
                      </div>
                    ))}
                    <span className="text-[10px] text-white/40 font-bold ml-1">Verrouillés</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Pharrell t'accompagne sur tes designs. Ada te guide pour trouver tes usines. Joy écrit tes scripts TikTok. Débloque-les maintenant.
                  </p>
                  <Link href="/auth/choose-plan" className="flex items-center justify-center gap-2 w-full bg-[#007AFF] hover:bg-[#0056CC] text-white font-bold rounded-full h-10 text-sm shadow-lg shadow-blue-900/30 transition-all">
                    Essai gratuit 3 jours
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
