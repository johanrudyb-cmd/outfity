
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getCurrentUser, getIsAdmin } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TrendViewRecorder } from '@/components/trends/TrendViewRecorder';
import Link from 'next/link';
import { ProductDetailImage } from '@/components/trends/ProductDetailImage';
import { ProductDetailEnricher } from '@/components/trends/ProductDetailEnricher';
import { EditTrendKpis } from '@/components/trends/EditTrendKpis';
import { ProductDetailCharts } from '@/components/trends/ProductDetailCharts';
import { BusinessInsights } from '@/components/trends/BusinessInsights';
import { VisualTrendScanner } from '@/components/trends/VisualTrendScanner';
import { BackToTrendsButton } from '@/components/trends/BackToTrendsButton';
import { getFeatureCountThisMonth } from '@/lib/ai-usage';
import {
  ArrowLeft,
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { getBaseUrl, cn } from '@/lib/utils';
import {
  computeSaturability,
  estimateInternalTrendPercent,
} from '@/lib/trend-product-kpis';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  // Logic from old page to handle view limits
  let isFeatured = false;
  try {
    const featuredRes = await fetch(`${getBaseUrl()}/api/trends/homepage-featured`);
    if (featuredRes.ok) {
      const data = await featuredRes.json();
      isFeatured = (data.trends || []).some((t: any) => t.id === id);
    }
  } catch (e) { }

  const isFree = user.plan === 'free';
  const shouldLockTrend = isFree && !isFeatured;

  // Quota check
  const checkImage = await getFeatureCountThisMonth(user.id, 'trends_check_image');
  const analyse = await getFeatureCountThisMonth(user.id, 'trends_analyse');
  const detailView = await getFeatureCountThisMonth(user.id, 'trends_detail_view');
  const analysesCount = checkImage + analyse + detailView;
  const maxAnalyses = isFree ? 3 : 10;
  if (!isFeatured && analysesCount >= maxAnalyses) {
    redirect('/trends?limit=reached');
  }

  const isAdmin = await getIsAdmin();
  const product = await prisma.trendProduct.findUnique({ where: { id } });
  if (!product) redirect('/trends');

  // --- KPI Calculation Logic ---
  const daysInRadar = Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const recurrenceInCategory = await prisma.trendProduct.count({
    where: { category: product.category, segment: product.segment ?? undefined },
  });
  const effectiveTrendGrowthPercent = product.trendGrowthPercent ?? estimateInternalTrendPercent({
    trendGrowthPercent: product.trendGrowthPercent ?? null,
    trendScoreVisual: product.trendScoreVisual ?? null,
    isGlobalTrendAlert: product.isGlobalTrendAlert ?? false,
    daysInRadar,
    recurrenceInCategory,
  });

  const displayTrendScore = (product.trendScoreVisual ?? product.trendScore ?? 50);

  // --- Signal Logic ---
  let signalLabel = 'SURVEILLANCE';
  let signalColor = 'text-gray-500 bg-gray-100';
  let signalColorBorder = 'border-gray-200';

  if (displayTrendScore >= 80) {
    signalLabel = 'OPPORTUNITÉ OR';
    signalColor = 'text-[#FF9F0A] bg-[#FF9F0A]/10';
    signalColorBorder = 'border-[#FF9F0A]/20';
  } else if (displayTrendScore >= 60) {
    signalLabel = 'ACHAT FORT';
    signalColor = 'text-[#34C759] bg-[#34C759]/10';
    signalColorBorder = 'border-[#34C759]/20';
  } else if (displayTrendScore >= 40) {
    signalLabel = 'MODÉRÉ';
    signalColor = 'text-[#007AFF] bg-[#007AFF]/10';
    signalColorBorder = 'border-[#007AFF]/20';
  }

  return (
    <DashboardLayout>
      {user.plan === 'free' && <TrendViewRecorder trendId={product.id} />}
      <ProductDetailEnricher productId={product.id} product={product}>
        <div className="min-h-screen bg-[#F5F5F7] pb-24 font-sans">

          {/* Header: Simple Back Navigation */}
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/[0.05] px-4 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link href="/trends" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">
                <ArrowLeft className="w-4 h-4" />
                RETOUR AU CATALOGUE
              </Link>
              <div className="text-xs font-black uppercase tracking-widest text-[#007AFF]">
                {product.id.slice(0, 8)}
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* --- TOP SECTION : TRADING DESK --- */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

              {/* LEFT : VISUAL ASSET */}
              <div className="space-y-6">
                <div className="relative aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl bg-white border border-black/[0.03]">
                  <ProductDetailImage
                    imageUrl={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {/* LIVE BADGE */}
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Live Market
                  </div>
                </div>

                {/* Visual Scanner Shortcut */}
                <div className="p-6 bg-white rounded-[24px] shadow-sm border border-black/[0.03] flex items-center justify-between group cursor-pointer hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black">Scanner l&apos;ADN Visuel</h3>
                      <p className="text-xs text-gray-500">Comparer avec d&apos;autres produits</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                </div>
              </div>

              {/* RIGHT : TRADING CONTROL PANEL */}
              <div className="space-y-8 pt-4">

                {/* Title Block */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded uppercase tracking-widest">
                      {product.category}
                    </span>
                    {product.segment && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-2 py-0.5 rounded">
                        {product.segment}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-black tracking-tighter leading-tight mb-4">
                    {product.name}
                  </h1>
                  <div className="text-lg font-medium text-gray-500 max-w-md leading-relaxed">
                    {product.description ? product.description.slice(0, 120) + '...' : 'Pas de description technique disponible.'}
                  </div>
                </div>

                {/* --- THE GAUGE --- */}
                <div className="p-8 bg-white rounded-[32px] shadow-xl border border-black/[0.03] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Score de Performance</h3>
                    <div className={cn("px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest border", signalColor, signalColorBorder)}>
                      Signal: {signalLabel}
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {/* Big Number */}
                    <div className="relative">
                      <span className="text-8xl font-black text-black tracking-tighter">
                        {displayTrendScore}
                      </span>
                      <span className="text-xl font-bold text-gray-300 absolute top-2 -right-6">%</span>
                    </div>

                    {/* Trend Indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[#34C759]">
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-lg font-black tracking-tight">
                          {effectiveTrendGrowthPercent > 0 ? '+' : ''}{effectiveTrendGrowthPercent}%
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Croissance 30j</p>
                    </div>
                  </div>

                  {/* Forecast Line (Visual Only) */}
                  <div className="mt-8 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-1000"
                      style={{ width: `${displayTrendScore}%` }}
                    />
                  </div>
                </div>

                {/* --- FINANCIAL GRID --- */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-[#F5F5F7] rounded-[24px] border border-black/[0.03]">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Prix Marché</span>
                    </div>
                    <p className="text-2xl font-black text-black">{product.averagePrice} €</p>
                  </div>
                  <div className="p-5 bg-[#F5F5F7] rounded-[24px] border border-black/[0.03]">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Risque Prod.</span>
                    </div>
                    <p className="text-2xl font-black text-black">{product.productionSafety || 'Faible'}</p>
                  </div>
                </div>

                {/* --- PRIMARY ACTION --- */}
                {!shouldLockTrend ? (
                  <Link
                    href="/production/start"
                    className="w-full py-5 bg-black text-white rounded-[20px] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Lancer la Production 🚀
                  </Link>
                ) : (
                  <div className="w-full py-5 bg-gray-100 text-gray-400 rounded-[20px] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest cursor-not-allowed">
                    <Lock className="w-4 h-4" />
                    Réservé Membres Pro
                  </div>
                )}

                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Estimation délai production: <span className="text-black font-bold">3 semaines</span>
                  </p>
                </div>
              </div>
            </div>

            {/* --- BOTTOM SECTION : DEEP DIVE (Optional/Admin) --- */}
            <div className="pt-12 border-t border-black/[0.05]">
              <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-black/[0.03]">
                <h2 className="text-2xl font-black text-black mb-8">Analyse Technique</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#007AFF]">Stratégie</h3>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                      {product.businessAnalysis || "Aucune analyse stratégique disponible pour le moment. Ce produit a été détecté par nos algorithmes de scrapping visuel."}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#007AFF]">Matière & Entretien</h3>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                      {product.material || "Non spécifié"}<br />
                      {product.careInstructions || ""}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#007AFF]">Détails Source</h3>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                      Source: {product.sourceBrand || "Inconnue"}<br />
                      ID: {product.id.substring(0, 8)}
                    </p>
                    {product.sourceUrl && (
                      <a href={product.sourceUrl} target="_blank" className="text-xs font-bold underline flex items-center gap-1">
                        Voir source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Admin Tools Hidden inside Details */}
                {isAdmin && (
                  <details className="mt-8 pt-8 border-t border-gray-100">
                    <summary className="text-xs font-bold text-gray-400 cursor-pointer uppercase tracking-widest mb-4">Outils Admin</summary>
                    <EditTrendKpis
                      productId={product.id}
                      trendGrowthPercent={product.trendGrowthPercent ?? null}
                      trendLabel={product.trendLabel ?? null}
                      displaySaturability={product.saturability}
                      saturabilityStyle={{ label: 'N/A', class: '' }}
                      isInternalPercent={false}
                    />
                  </details>
                )}
              </div>
            </div>

          </div>
        </div>
        <p className="max-w-7xl mx-auto px-6 text-[10px] text-[#86868B] text-center mt-12 font-medium leading-relaxed">
          Les analyses et prédictions de tendances sont basées sur des algorithmes de données et constituent un outil d'aide à la décision. <br />
          Elles ne garantissent pas les ventes futures ni le succès commercial d'un vêtement.
        </p>
      </ProductDetailEnricher>
    </DashboardLayout>
  );
}
