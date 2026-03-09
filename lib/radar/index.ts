/**
 * OUTFITY Radar Engine V3
 * ========================
 * Orchestrateur principal du nouveau radar.
 *
 * Sources (en ordre de priorité) :
 *  1. Google Trends → Signal prédicteur (demande future)
 *  2. Zalando Trending → Signal marché (ce qui se vend maintenant)
 *  3. Indie Stores Shopify → Signal avant-garde (6 mois en avance)
 *
 * Sources supprimées vs V2 :
 *  ❌ TikTok Creative Center scraping → trop instable, structure change toutes les semaines
 *  ❌ Facebook Ad Library → bloqué par Meta systématiquement
 *  ❌ Pinterest hardcodé → c'était de la fiction, pas de la data
 *
 * Scoring :
 *  Google Trends (40%) + Marché Zalando (35%) + Signal Indie (25%)
 *  → Formule documentée, pas de Math.random()
 */

import { getGoogleTrendSignals } from './sources/google-trends';
import { getZalandoTrendSignals } from './sources/zalando';
import { getIndieStoreSignals } from './sources/indie-stores';
import { computeRadarScores, type RadarTrend } from './scoring';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type { RadarTrend };

/**
 * Lance le scan complet du radar.
 * Retourne les tendances scorées, prêtes à être affichées ou sauvegardées.
 */
export async function runRadarScan(): Promise<RadarTrend[]> {
    console.log('\n🌐 OUTFITY RADAR V3 — Démarrage du scan...\n');
    const startTime = Date.now();

    // Récupération des signaux en parallèle (Zalando + Indie)
    // Google Trends est séquentiel pour éviter le throttling
    const [zalandoSignals, indieSignals] = await Promise.all([
        getZalandoTrendSignals().catch((e) => {
            console.error('[Radar] Zalando a échoué:', e.message);
            return [];
        }),
        getIndieStoreSignals().catch((e) => {
            console.error('[Radar] IndieStores a échoué:', e.message);
            return [];
        }),
    ]);

    // Google Trends en dernier (plus lent, rate-limited)
    const googleSignals = await getGoogleTrendSignals().catch((e) => {
        console.error('[Radar] Google Trends a échoué:', e.message);
        return [];
    });

    console.log(`\n📊 Signaux collectés :
  - Google Trends : ${googleSignals.length}
  - Zalando       : ${zalandoSignals.length}
  - Indie Stores  : ${indieSignals.length}
  `);

    if (googleSignals.length === 0) {
        console.warn('[Radar] ⚠️ Aucun signal Google Trends. Scan annulé.');
        return [];
    }

    // Calcul des scores
    const trends = computeRadarScores(googleSignals, zalandoSignals, indieSignals);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Radar terminé en ${elapsed}s — ${trends.length} tendances scorées\n`);

    // Affichage du top 10
    console.log('🏆 TOP 10 TENDANCES :');
    trends.slice(0, 10).forEach((t, i) => {
        const warn = t.productionWarning ? ` ⚠️ ${t.productionWarning}` : '';
        console.log(
            `  ${i + 1}. ${t.name.padEnd(28)} | ${t.trendLabel.padEnd(10)} | Score: ${t.score} (G:${t.googleScore} M:${t.marketScore} I:${t.indieScore}) | +${t.growthPercent}%${warn}`
        );
    });

    return trends;
}

/**
 * Sauvegarde les tendances scorées en base de données (upsert).
 */
export async function saveRadarTrends(trends: RadarTrend[]): Promise<void> {
    console.log(`\n💾 Sauvegarde de ${trends.length} tendances en DB...`);
    let saved = 0;

    for (const trend of trends) {
        try {
            await (prisma.trendProduct as any).upsert({
                where: { sourceUrl: trend.sourceUrl },
                update: {
                    trendScore: trend.score,
                    trendGrowthPercent: trend.growthPercent,
                    trendLabel: trend.trendLabel,
                    businessAnalysis: `Score Google: ${trend.googleScore}/100 | Marché: ${trend.marketScore}/100 | Indie: ${trend.indieScore}/100. ${trend.productionWarning || ''}`,
                    productionSafety: trend.productionViable ? 'SÛR' : 'RISQUÉ',
                    weatherSignal: trend.weatherSignal,
                    updatedAt: new Date(),
                },
                create: {
                    name: trend.name,
                    category: trend.category,
                    style: trend.trendLabel,
                    segment: trend.segment,
                    trendScore: trend.score,
                    trendGrowthPercent: trend.growthPercent,
                    trendLabel: trend.trendLabel,
                    saturability: Math.max(0, 100 - trend.score),
                    imageUrl: trend.imageUrl,
                    sourceUrl: trend.sourceUrl,
                    averagePrice: (trend.priceRange.min + trend.priceRange.max) / 2,
                    businessAnalysis: `Score Google: ${trend.googleScore}/100 | Marché: ${trend.marketScore}/100 | Indie: ${trend.indieScore}/100. ${trend.productionWarning || ''}`,
                    productionSafety: trend.productionViable ? 'SÛR' : 'RISQUÉ',
                    weatherSignal: trend.weatherSignal,
                    marketZone: 'EU',
                    material: 'Mix',
                    lastScan: 'Just now',
                    aiConfidence: 70,
                },
            });
            saved++;
        } catch (e) {
            console.warn(`[Radar] Impossible de sauvegarder "${trend.name}":`, e);
        }
    }

    console.log(`✅ ${saved}/${trends.length} tendances sauvegardées en DB\n`);
}
