import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import { TrendsHero } from '@/components/homepage/TrendsHero';

// Lazy load — sections below the fold
const HowItWorks = dynamic(() => import('@/components/homepage/HowItWorks'));
const BeforeAfter = dynamic(() => import('@/components/homepage/BeforeAfter'));
const TrendsByMarket = dynamic(() => import('@/components/homepage/TrendsByMarket'));
const AgentsPresentation = dynamic(() => import('@/components/homepage/AgentsPresentation'));
const TechPackShowcase = dynamic(() => import('@/components/homepage/TechPackShowcase'));
const MarginCalculator = dynamic(() => import('@/components/homepage/MarginCalculator'));
const TestimonialsSection = dynamic(() => import('@/components/homepage/TestimonialsSection'));
const SalesPricing = dynamic(() => import('@/components/homepage/SalesPricing'));
const CTASection = dynamic(() => import('@/components/homepage/CTASection'));
const FAQSection = dynamic(() => import('@/components/homepage/FAQSection'));
const Footer = dynamic(() => import('@/components/homepage/Footer'));

import { LazySection } from '@/components/common/LazySection';

function SectionSkeleton() {
  return <div className="w-full h-[300px] bg-[#F5F5F7]" aria-hidden />;
}

export const revalidate = 3600;

export default async function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── ABOVE THE FOLD ── */}
      <AnimatedHeader />
      <TrendsHero />

      {/* ── BELOW THE FOLD ── */}

      {/* Comment ça marche — 3 étapes */}
      <LazySection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <HowItWorks />
        </Suspense>
      </LazySection>

      {/* Avant / Après */}
      <LazySection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <BeforeAfter />
        </Suspense>
      </LazySection>

      {/* Radar de tendances */}
      <LazySection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <TrendsByMarket />
        </Suspense>
      </LazySection>

      {/* Agents IA */}
      <div id="features">
        <Suspense fallback={<SectionSkeleton />}>
          <AgentsPresentation />
        </Suspense>
      </div>

      {/* Tech Pack */}
      <LazySection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <TechPackShowcase />
        </Suspense>
      </LazySection>

      {/* Simulateur ROI */}
      <LazySection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <MarginCalculator />
        </Suspense>
      </LazySection>

      {/* Témoignages */}
      <div id="testimonials-section">
        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>
      </div>

      {/* Pricing */}
      <div id="pricing-section">
        <Suspense fallback={<SectionSkeleton />}>
          <SalesPricing />
        </Suspense>
      </div>

      {/* CTA Final */}
      <LazySection fallback={<SectionSkeleton />}>
        <Suspense fallback={<SectionSkeleton />}>
          <CTASection />
        </Suspense>
      </LazySection>

      {/* FAQ */}
      <div id="faq-section">
        <Suspense fallback={<SectionSkeleton />}>
          <FAQSection />
        </Suspense>
      </div>

      {/* Footer */}
      <LazySection fallback={null}>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </LazySection>
    </main>
  );
}
