import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import { TrendsHero } from '@/components/homepage/TrendsHero';
import { StatsSection } from '@/components/homepage/StatsSection';
import { TrendsByMarket } from '@/components/homepage/TrendsByMarket';
import { FashionGallery } from '@/components/homepage/FashionGallery';
import { MarginCalculator } from '@/components/homepage/MarginCalculator';
import { TechPackShowcase } from '@/components/homepage/TechPackShowcase';
import { TestimonialsSection } from '@/components/homepage/TestimonialsSection';
import { SalesPricing } from '@/components/homepage/SalesPricing';
import { BlogGrid } from '@/components/homepage/BlogGrid';
import { FAQSection } from '@/components/homepage/FAQSection';
import { CTASection } from '@/components/homepage/CTASection';
import { AgentsPresentation } from '@/components/homepage/AgentsPresentation';
import { EfficiencyShowcase } from '@/components/homepage/EfficiencyShowcase';
import { Footer } from '@/components/homepage/Footer';
import { getFeaturedTrends } from '@/lib/trends-data';

export const revalidate = 60; // Revalider toutes les minutes

export default async function Home() {
  const initialTrends = await getFeaturedTrends();

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <AnimatedHeader />
      <TrendsHero />
      <TrendsByMarket />
      <AgentsPresentation />
      <TechPackShowcase />
      <EfficiencyShowcase />
      <StatsSection />
      <FashionGallery />
      <MarginCalculator />
      <TestimonialsSection />
      <SalesPricing />
      <CTASection />
      <BlogGrid />
      <FAQSection />
      <Footer />
    </main>
  );
}
