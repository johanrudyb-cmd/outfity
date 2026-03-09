/**
 * Test rapide du nouveau Radar V3
 * Lance un scan complet et affiche les résultats dans le terminal.
 * Usage : npx tsx tmp/test-radar-v3.ts
 */
import 'dotenv/config';
import { runRadarScan } from '../lib/radar/index';

async function main() {
    console.log('='.repeat(60));
    console.log('   OUTFITY RADAR V3 — TEST DE VALIDATION');
    console.log('='.repeat(60));

    const { runRadarScan, saveRadarTrends } = await import('../lib/radar');
    const trends = await runRadarScan();
    await saveRadarTrends(trends);

    if (trends.length === 0) {
        console.error('❌ Aucune tendance retournée. Vérifiez les sources.');
        process.exit(1);
    }

    console.log('\n📋 RÉSULTATS DÉTAILLÉS :');
    trends.slice(0, 5).forEach((t) => {
        console.log(`\n─ ${t.name}`);
        console.log(`  Score global   : ${t.score}/100`);
        console.log(`  Google Trends  : ${t.googleScore}/100 (+${t.growthPercent}%)`);
        console.log(`  Marché Zalando : ${t.marketScore}/100`);
        console.log(`  Signal indie   : ${t.indieScore}/100`);
        console.log(`  Catégorie      : ${t.category}`);
        console.log(`  Label          : ${t.trendLabel}`);
        console.log(`  Production OK  : ${t.productionViable ? '✅' : '❌'} ${t.productionWarning || ''}`);
        console.log(`  Météo/Saison   : ${t.weatherSignal}`);
        console.log(`  Prix estimé    : ${t.priceRange.min}€ – ${t.priceRange.max}€`);
        if (t.brandExamples.length > 0) {
            console.log(`  Vu chez        : ${t.brandExamples.join(', ')}`);
        }
    });

    console.log('\n✅ Test terminé avec succès.');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Erreur critique:', err);
    process.exit(1);
});
