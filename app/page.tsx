import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import { TrendsHero } from '@/components/homepage/TrendsHero';
import { HomeBelowFold } from '@/components/homepage/HomeBelowFold';

export const revalidate = 3600;

export default async function Home() {
  return (
    <main className="min-h-screen bg-white">
      <AnimatedHeader />
      <TrendsHero />
      <HomeBelowFold />
    </main>
  );
}
