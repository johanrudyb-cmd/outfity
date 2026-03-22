'use client';

import dynamic from 'next/dynamic';
import { LazySection } from '@/components/common/LazySection';

function SectionSkeleton() {
  return <div className="w-full h-[300px] bg-[#F5F5F7]" aria-hidden />;
}

const HowItWorks = dynamic(() => import('@/components/homepage/HowItWorks'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const BeforeAfter = dynamic(() => import('@/components/homepage/BeforeAfter'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const AgentsPresentation = dynamic(() => import('@/components/homepage/AgentsPresentation'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const TechPackShowcase = dynamic(() => import('@/components/homepage/TechPackShowcase'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const MarginCalculator = dynamic(() => import('@/components/homepage/MarginCalculator'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const TestimonialsSection = dynamic(() => import('@/components/homepage/TestimonialsSection'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const SalesPricing = dynamic(() => import('@/components/homepage/SalesPricing'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const CTASection = dynamic(() => import('@/components/homepage/CTASection'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const FAQSection = dynamic(() => import('@/components/homepage/FAQSection'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const Footer = dynamic(() => import('@/components/homepage/Footer'), {
  ssr: false,
  loading: () => null,
});

export function HomeBelowFold() {
  return (
    <>
      <LazySection fallback={<SectionSkeleton />}>
        <HowItWorks />
      </LazySection>

      <LazySection fallback={<SectionSkeleton />}>
        <BeforeAfter />
      </LazySection>

      <div id="features">
        <AgentsPresentation />
      </div>

      <LazySection fallback={<SectionSkeleton />}>
        <TechPackShowcase />
      </LazySection>

      <LazySection fallback={<SectionSkeleton />}>
        <MarginCalculator />
      </LazySection>

      <div id="testimonials-section">
        <TestimonialsSection />
      </div>

      <div id="pricing-section">
        <SalesPricing />
      </div>

      <LazySection fallback={<SectionSkeleton />}>
        <CTASection />
      </LazySection>

      <div id="faq-section">
        <FAQSection />
      </div>

      <LazySection fallback={null}>
        <Footer />
      </LazySection>
    </>
  );
}
