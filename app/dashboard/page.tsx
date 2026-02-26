import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardRefresh } from '@/components/dashboard/DashboardRefresh';
import { DashboardNotifications } from '@/components/dashboard/DashboardNotifications';
import { DashboardStatsSkeleton } from '@/components/dashboard/DashboardStats';
import { StrategyUpdateBanner } from '@/components/dashboard/StrategyUpdateBanner';
import { UpgradeSessionRefresh } from '@/components/dashboard/UpgradeSessionRefresh';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getWeekEvents } from '@/lib/calendar-week-events';
import { isFreePlan } from '@/lib/plan-utils';
import {
  TrendingUp,
  ArrowRight,
  Crown,
  Calendar as CalendarIcon,
  Shirt,
  FileText,
  Map,
  Scan,
  Calculator,
  PenLine,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Rocket,
  Factory,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  const [brand, initialLaunchMap] = await Promise.all([
    prisma.brand.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.launchMap.findFirst({
      where: { brand: { userId: user.id } },
    }),
  ]);

  if (!brand) redirect('/onboarding');

  const launchMap = initialLaunchMap || await prisma.launchMap.findUnique({
    where: { brandId: brand.id },
  });

  const hasIdentity = !!(brand.logo || brand.colorPalette || brand.typography);
  const weekEvents = getWeekEvents(launchMap?.contentCalendar ?? null);
  const isFree = isFreePlan(user.plan);

  // Launch Map phases
  const phases = [
    { id: 0, label: 'Identité', icon: LayoutDashboard, done: hasIdentity },
    { id: 1, label: 'Stratégie', icon: Rocket, done: !!launchMap?.phase1 },
    { id: 3, label: 'Visuels', icon: Shirt, done: !!launchMap?.phase3 },
    { id: 4, label: 'Tech Pack', icon: FileText, done: !!launchMap?.phase4 },
    { id: 5, label: 'Sourcing', icon: Factory, done: !!launchMap?.phase5 },
    { id: 7, label: 'Boutique', icon: Store, done: !!launchMap?.phase7 },
  ];
  const completedCount = phases.filter(p => p.done).length;
  const progress = Math.round((completedCount / phases.length) * 100);
  const nextPhase = phases.find(p => !p.done) ?? phases[phases.length - 1];

  // Date du jour
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Prénom
  const nameParts = user.name?.split(' ') ?? [];
  const firstName = (nameParts.find(p => p.length > 1 && !/^[A-ZÀ-Ÿ\s-]{2,}$/.test(p)) ?? nameParts[0] ?? 'Créateur');
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  // Outils actifs seulement
  const quickTools = [
    {
      title: 'Tendances Virales',
      subtitle: 'Top TikTok & Instagram',
      href: '/trends',
      icon: TrendingUp,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      accent: 'group-hover:border-blue-200',
    },
    {
      title: 'Détecter une tendance',
      subtitle: 'Analyse IA par photo',
      href: '/trends/visual',
      icon: Scan,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
      accent: 'group-hover:border-violet-200',
    },
    {
      title: 'Création de contenu',
      subtitle: 'Posts & planification',
      href: '/content-creation',
      icon: PenLine,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      accent: 'group-hover:border-orange-200',
    },
    {
      title: 'Calculateur de marge',
      subtitle: 'Rentabilité par article',
      href: '/calculator',
      icon: Calculator,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      accent: 'group-hover:border-emerald-200',
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden pb-24 sm:pb-12">

        {/* Pattern de fond (Dots) façon "Premium SaaS" avec fondu vers le bas */}
        <div className="absolute inset-0 bg-[radial-gradient(#c7c7cc_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] pointer-events-none opacity-40 mix-blend-multiply" />

        {/* Décoration d'arrière-plan (Ambient Glow) légèrement rehaussée */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/[0.06] rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 -translate-y-1/4" />
        <div className="absolute top-[20%] left-0 w-[500px] h-[500px] bg-violet-500/[0.05] rounded-full blur-[120px] pointer-events-none transform -translate-x-1/2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[800px] h-[800px] bg-orange-500/[0.04] rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-6 lg:px-12 py-8 sm:py-10 max-w-7xl mx-auto space-y-8 sm:space-y-10">
          {/* Refresh JWT silencieux si retour de paiement Stripe */}
          <Suspense fallback={null}>
            <UpgradeSessionRefresh />
          </Suspense>

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#86868B] uppercase tracking-widest mb-1">
                {today.charAt(0).toUpperCase() + today.slice(1)}
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] tracking-tight leading-none">
                Hello, {displayName} 👋
              </h1>
              <p className="text-[#86868B] mt-2 text-base">
                Voici l&apos;état de <span className="text-[#1D1D1F] font-semibold">{brand.name}</span> aujourd&apos;hui.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!isFree && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF]/10 text-[#007AFF] rounded-full text-[10px] font-bold border border-[#007AFF]/20 uppercase tracking-widest">
                  <Crown className="w-3 h-3" /> Plan Créateur
                </div>
              )}
              <DashboardNotifications />
              <DashboardRefresh />
            </div>
          </div>

          {/* Strategy Update Banner */}
          {!isFree && <StrategyUpdateBanner />}

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* ── LEFT (2/3) ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Launch Map — Focus / CTA Hero */}
              <div data-tour="tour-journey" className="relative overflow-hidden rounded-[32px] bg-white border border-black/[0.06] shadow-apple p-8">
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#007AFF]/8 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  {/* Left: Next step info */}
                  <div className="flex-1 space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#007AFF]/10 rounded-lg">
                        <Map className="w-4 h-4 text-[#007AFF]" />
                      </div>
                      <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">
                        Launch Map — Prochaine étape
                      </span>
                    </div>

                    <div>
                      <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
                        {nextPhase.label}
                      </h2>
                      <p className="text-[#86868B] mt-2 text-base leading-relaxed max-w-lg">
                        Complétez cette phase pour faire avancer <strong className="text-[#1D1D1F]">{brand.name}</strong> vers son lancement.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link href="/launch-map" className="inline-block">
                        <Button className="bg-[#007AFF] hover:bg-[#0056CC] text-white rounded-full px-7 h-12 font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.97] transition-all border-0">
                          Continuer
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Right: Circular progress */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-black/5" strokeWidth="7" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                        <circle
                          className="text-[#007AFF]"
                          strokeWidth="7"
                          strokeDasharray={2 * Math.PI * 42}
                          strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="42"
                          cx="50"
                          cy="50"
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[#1D1D1F]">{progress}%</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest">Progression</p>
                      <p className="text-sm font-semibold text-[#1D1D1F]">{completedCount} / {phases.length} phases</p>
                    </div>
                  </div>
                </div>

                {/* Phases timeline */}
                <div className="relative z-10 mt-8 pt-6 border-t border-black/5">
                  <div className="relative flex items-start justify-between overflow-x-auto pb-1">
                    {/* Ligne de fond globale */}
                    <div className="absolute top-[18px] left-[8%] right-[8%] h-[2px] bg-[#F5F5F7] -z-10" />
                    {/* Ligne de progression (calcul approximatif basé sur l'index) */}
                    <div
                      className="absolute top-[18px] left-[8%] h-[2px] bg-[#007AFF] -z-10 transition-all duration-1000"
                      style={{ width: `${Math.max(0, (phases.findIndex(p => p.id === nextPhase.id) / (phases.length - 1)) * 84)}%` }}
                    />

                    {phases.map((phase, i) => {
                      const Icon = phase.icon;
                      const isNext = phase.id === nextPhase.id;
                      return (
                        <div key={phase.id} className="flex flex-col items-center gap-2 flex-1 min-w-[60px] relative z-10">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all bg-white",
                            phase.done
                              ? 'border-[#007AFF] text-[#007AFF]'
                              : isNext
                                ? 'border-[#007AFF] text-[#007AFF] shadow-md shadow-blue-500/20'
                                : 'border-[#E5E5EA] text-[#86868B]'
                          )}>
                            {phase.done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>

                          <div className="flex flex-col items-center gap-1 mt-0.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#86868B]">
                              Étape {i + 1}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold text-center leading-none",
                              phase.done ? 'text-[#007AFF]' : isNext ? 'text-[#1D1D1F]' : 'text-[#86868B]'
                            )}>
                              {phase.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tools Grid — Accès rapide */}
              <div>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-lg font-bold text-[#1D1D1F]">Vos outils</h2>
                  <span className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest">
                    Accès rapide
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {quickTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className={cn(
                          "group bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 border border-black/[0.05] shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all duration-200 hover:shadow-apple active:scale-[0.97]",
                          tool.accent
                        )}
                      >
                        <div className="flex items-center justify-between w-full sm:w-auto">
                          <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", tool.iconBg)}>
                            <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", tool.iconColor)} />
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#C7C7CC] shrink-0 group-hover:text-[#86868B] transition-colors sm:hidden" />
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="font-bold text-[13px] sm:text-sm text-[#1D1D1F] leading-snug line-clamp-2">{tool.title}</p>
                          <p className="text-[11px] text-[#86868B] mt-0.5 line-clamp-1">{tool.subtitle}</p>
                        </div>
                        <ChevronRight className="hidden sm:block w-4 h-4 text-[#C7C7CC] shrink-0 group-hover:text-[#86868B] transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* ── RIGHT (1/3) ── */}
            <div className="space-y-6">

              {/* Weekly Calendar */}
              <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#007AFF]/10 rounded-lg">
                      <CalendarIcon className="w-4 h-4 text-[#007AFF]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1D1D1F] text-sm">Cette semaine</h3>
                      <p className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest">
                        {weekEvents.length} post{weekEvents.length !== 1 ? 's' : ''} prévu{weekEvents.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Link href="/content-creation" className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center hover:bg-[#007AFF]/10 hover:text-[#007AFF] transition-colors text-[#86868B]">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {weekEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-[#F5F5F7] rounded-2xl">
                    <CalendarIcon className="w-8 h-8 text-[#C7C7CC] mb-2" />
                    <p className="text-sm font-semibold text-[#1D1D1F]">Aucun post prévu</p>
                    <p className="text-[11px] text-[#86868B] mt-0.5 mb-3">Planifiez votre contenu de la semaine</p>
                    <Link href="/content-creation">
                      <button className="text-[11px] font-bold text-[#007AFF] hover:underline">
                        + Ajouter un post
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {weekEvents.slice(0, 4).map((ev) => (
                      <div key={ev.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F7] hover:bg-[#007AFF]/5 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-[#007AFF] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1D1D1F] truncate">{ev.title}</p>
                          <p className="text-[10px] text-[#86868B] uppercase font-bold tracking-wide">{ev.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shopify Promo Banner (Below Calendar) */}
              <div className="relative overflow-hidden rounded-[28px] bg-[#000000] p-6 text-white shadow-apple">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#95BF47]/20 rounded-full blur-[50px] pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="h-8 mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/shopify-logo.png" alt="Shopify" className="h-full object-contain" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-lg text-white leading-tight">Lancez votre boutique</h3>
                    <p className="text-[#86868B] text-[13px] font-medium leading-relaxed">
                      Essayez gratuitement pendant 3 jours, puis payez <strong className="text-white font-bold">1 €/mois</strong> pendant 3 mois.
                    </p>
                  </div>
                  <Link href="https://shopify.com" target="_blank" rel="noopener noreferrer" className="block pt-1">
                    <Button className="w-full bg-[#95BF47] hover:bg-[#7A9D3A] text-white font-bold rounded-full h-10 text-[13px] border-0 transition-all active:scale-[0.98]">
                      Profiter de l'offre
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Paywall Upsell for free users */}
              {isFree && (
                <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D1D1F] to-[#3a3a3c] p-6 text-white">
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#007AFF]/20 rounded-full blur-[50px]" />
                  <div className="relative z-10 space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#007AFF] flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-white">Passez au Plan Créateur</h3>
                    <p className="text-white/70 text-xs leading-relaxed">
                      Déverrouillez tous les outils IA, mockups illimités et support prioritaire.
                    </p>
                    <Link href="/auth/choose-plan">
                      <Button className="w-full bg-[#007AFF] hover:bg-[#0056CC] text-white font-bold rounded-full h-10 text-sm border-0 shadow-lg shadow-blue-900/30 mt-1">
                        Débloquer maintenant
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
