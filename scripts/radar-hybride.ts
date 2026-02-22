
import { PrismaClient } from '@prisma/client';
import { ViralRadarEngine } from '../lib/viral-radar-engine';
import { updateMarketSnapshot } from '../lib/market-stock-exchange';

const prisma = new PrismaClient();

async function runRadar() {
    console.log('\n--- 🚀 DEBUT DU RADAR DE VIRALITÉ OUTFITY 360 ---');
    console.log('Objectif : Croiser TikTok, Pinterest et Google Trends\n');

    const engine = new ViralRadarEngine();

    try {
        // 1. Lancement du Radar Viral (TikTok/Pinterest/Google)
        await engine.runFullViralRadar();

        // 2. Synchronisation vers l'Index de Marché (Pour les graphiques)
        console.log('🔄 Synchronisation vers l\'index de marché...');

        const trends = await (prisma.trendProduct as any).findMany({
            where: {
                OR: [
                    { category: 'VIRAL' },
                    { trendScore: { gt: 80 } }
                ]
            }
        });

        const groups: Record<string, any[]> = {};
        for (const t of trends) {
            const key = `${t.category}|${t.segment || 'homme'}|${t.marketZone || 'EU'}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        }

        for (const [key, items] of Object.entries(groups)) {
            const [cat, seg, zone] = key.split('|');
            const avgScore = items.reduce((acc, t) => acc + t.trendScore, 0) / items.length;
            const avgSaturability = items.reduce((acc, t) => acc + (t.saturability || 0), 0) / items.length;

            updateMarketSnapshot(cat, seg, zone, items.length, avgScore, avgSaturability);
        }

        console.log('✅ Synchronisation de l\'index terminée.');

    } catch (error: any) {
        console.error('❌ Erreur critique lors du radar:', error.message);
    }

    console.log('\n--- ✨ RADAR TERMINE ---');
}

runRadar()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

