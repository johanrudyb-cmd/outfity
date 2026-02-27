import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import { TrendsHero } from '@/components/homepage/TrendsHero';
import { getFeaturedTrends } from '@/lib/trends-data';

// Lazy load — sections below the fold (don't block initial render)
const TrendsByMarket = dynamic(() => import('@/components/homepage/TrendsByMarket'));
const AgentsPresentation = dynamic(() => import('@/components/homepage/AgentsPresentation'));
const TechPackShowcase = dynamic(() => import('@/components/homepage/TechPackShowcase'));
const EfficiencyShowcase = dynamic(() => import('@/components/homepage/EfficiencyShowcase'));
const StatsSection = dynamic(() => import('@/components/homepage/StatsSection'));
const FashionGallery = dynamic(() => import('@/components/homepage/FashionGallery'));
const MarginCalculator = dynamic(() => import('@/components/homepage/MarginCalculator'));
const TestimonialsSection = dynamic(() => import('@/components/homepage/TestimonialsSection'));
const SalesPricing = dynamic(() => import('@/components/homepage/SalesPricing'));
const CTASection = dynamic(() => import('@/components/homepage/CTASection'));
const BlogGrid = dynamic(() => import('@/components/homepage/BlogGrid'));
const FAQSection = dynamic(() => import('@/components/homepage/FAQSection'));
const Footer = dynamic(() => import('@/components/homepage/Footer'));

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
