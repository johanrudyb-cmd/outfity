import { prisma } from './prisma';
import { getSeasonalRecommendation } from './seasonal-recommendation';

interface GenerateRecommendationsParams {
  brandName: string;
  styleGuide?: any;
  launchMap?: any;
  strategy?: any;
}

/**
 * Génère des recommandations INTELLIGENTES pour le créateur
 * Basé sur : Le Radar de Viralité, la Saisonnalité et l'Identité de marque.
 */
export async function generateGarmentRecommendations(
  params: GenerateRecommendationsParams
): Promise<string[]> {
  const { brandName, launchMap } = params;
  const productType = (launchMap?.phase1Data as any)?.productType || 'tshirt';
  const seasonal = getSeasonalRecommendation();

  // 1. Chercher si ce type de produit est "Hot" sur le radar actuellement
  const topTrends = await prisma.trendProduct.findMany({
    where: {
      name: { contains: productType, mode: 'insensitive' },
      trendScore: { gt: 70 }
    },
    orderBy: { trendScore: 'desc' },
    take: 1
  });

  const activeTrend = topTrends[0];
  const recommendations: string[] = [];

  // 2. RECOMMANDATION STRATÉGIQUE (BASÉE SUR LE RADAR)
  if (activeTrend) {
    recommendations.push(
      `🔥 Tendance Détectée : Le style "${activeTrend.name}" explose sur TikTok (Score: ${activeTrend.trendScore.toFixed(0)}%). Inspirez-vous de cette esthétique.`,
      `⚠️ Conseil Production : Le marché est actuellement ${activeTrend.productionSafety === 'SÛR' ? 'favorable' : 'très compétitif'}. ${activeTrend.opportunityReason}`
    );
  } else {
    recommendations.push(
      `💡 Note : Votre choix de ${productType} est un basique solide. Pour le rendre viral, essayez d'y injecter un détail "Coquette" ou "Racing", très populaires ce mois-ci.`
    );
  }

  // 3. RECOMMANDATION TECHNIQUE (SAISONNALITÉ)
  recommendations.push(
    `📅 Saisonnalité : ${seasonal.label}. ${seasonal.reason}`,
    `🧵 Matière suggérée : Pour un positionnement premium, visez un coton lourd de ${seasonal.weight.replace(' g/m²', '')}g.`
  );

  // 4. CONSEIL BUSINESS
  recommendations.push(
    `🚀 Stratégie : Concentrez-vous sur un seul coloris fort pour votre lancement ${brandName} afin de minimiser les risques de stock tout en testant votre communauté.`
  );

  return recommendations.slice(0, 5);
}
