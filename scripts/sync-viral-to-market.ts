import { PrismaClient } from '@prisma/client';
import { updateMarketSnapshot } from '../lib/market-stock-exchange';

const prisma = new PrismaClient();

async function syncViralToMarket() {
    console.log('🔄 Synchronisation des Tendances VIRALES vers l\'Index de Marché...');

    try {
        // 1. Récupérer les moyennes par catégorie/segment/zone
        // On se concentre sur les tendances "VIRAL" ou les scores élevés
        const trends = await (prisma.trendProduct as any).findMany({
            where: {
                OR: [
                    { category: 'VIRAL' },
                    { trendScore: { gt: 80 } }
                ]
            }
        });

        if (trends.length === 0) {
            console.log('⚠️ Aucune tendance virale trouvée pour la synchro.');
            return;
        }

        // Grouper par Catégorie et Segment
        const groups: Record<string, any[]> = {};
        for (const t of trends) {
            const key = `${t.category}|${t.segment || 'mix'}|${t.marketZone || 'EU'}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        }

        for (const [key, items] of Object.entries(groups)) {
            const [cat, seg, zone] = key.split('|');
            const avgScore = items.reduce((acc, t) => acc + t.trendScore, 0) / items.length;
            const avgSaturability = items.reduce((acc, t) => acc + (t.saturability || 0), 0) / items.length;

            console.log(`📊 Updating Index: ${cat} (${seg}) | Score: ${avgScore.toFixed(1)} | Items: ${items.length}`);

            updateMarketSnapshot(
                cat,
                seg,
                zone,
                items.length,
                avgScore,
                avgSaturability
            );
        }

        console.log('✅ Index de marché mis à jour avec les signaux viraux.');

    } catch (error) {
        console.error('❌ Erreur synchro marché:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncViralToMarket();
