import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import { TrendsHero } from '@/components/homepage/TrendsHero';
import { getFeaturedTrends } from '@/lib/trends-data';

// Lazy load — sections below the fold (don't block initial render)
const TrendsByMarket = dynamic(() => import('@/components/homepage/TrendsByMarket').then((mod) => mod.TrendsByMarket as any), { ssr: false });
const AgentsPresentation = dynamic(() => import('@/components/homepage/AgentsPresentation').then((mod) => mod.AgentsPresentation as any));
const TechPackShowcase = dynamic(() => import('@/components/homepage/TechPackShowcase').then((mod) => mod.TechPackShowcase as any));
const EfficiencyShowcase = dynamic(() => import('@/components/homepage/EfficiencyShowcase').then((mod) => mod.EfficiencyShowcase as any));
const StatsSection = dynamic(() => import('@/components/homepage/StatsSection').then((mod) => mod.StatsSection as any));
const FashionGallery = dynamic(() => import('@/components/homepage/FashionGallery').then((mod) => mod.FashionGallery as any));
const MarginCalculator = dynamic(() => import('@/components/homepage/MarginCalculator').then((mod) => mod.MarginCalculator as any));
const TestimonialsSection = dynamic(() => import('@/components/homepage/TestimonialsSection').then((mod) => mod.TestimonialsSection as any));
const SalesPricing = dynamic(() => import('@/components/homepage/SalesPricing').then((mod) => mod.SalesPricing as any));
const CTASection = dynamic(() => import('@/components/homepage/CTASection').then((mod) => mod.CTASection as any));
const BlogGrid = dynamic(() => import('@/components/homepage/BlogGrid').then((mod) => mod.BlogGrid as any));
const FAQSection = dynamic(() => import('@/components/homepage/FAQSection').then((mod) => mod.FAQSection as any));
const Footer = dynamic(() => import('@/components/homepage/Footer').then((mod) => mod.Footer as any));

// Minimal skeleton placeholder for lazy sections
function SectionSkeleton() {
  return <div className="w-full h-[300px] bg-[#F5F5F7]" aria-hidden />;
}

export const revalidate = 3600; // Revalider toutes les heures (au lieu de toutes les minutes)

export default async function Home() {
  const initialTrends = await getFeaturedTrends();

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      {/* ── ABOVE THE FOLD — chargé immédiatement ── */}
      <AnimatedHeader />
      <TrendsHero />

      {/* ── BELOW THE FOLD — chargé en lazy ── */}
      <Suspense fallback={<SectionSkeleton />}><TrendsByMarket /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><AgentsPresentation /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><TechPackShowcase /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><EfficiencyShowcase /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><StatsSection /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><FashionGallery /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><MarginCalculator /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><TestimonialsSection /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><SalesPricing /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><CTASection /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><BlogGrid /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><FAQSection /></Suspense>
      <Suspense fallback={null}><Footer /></Suspense>
    </main>
  );
}
