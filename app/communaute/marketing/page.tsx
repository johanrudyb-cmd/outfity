import marketingGuide from '@/data/marketing-guide.json';
import { MarketingGuideClient } from './MarketingGuideClient';

// Lecture statique du JSON généré une seule fois
// Pour regénérer le contenu : node scripts/generate-marketing-guide.mjs
export default function MarketingCrashCoursePage() {
    return <MarketingGuideClient guideData={marketingGuide as any} />;
}
