import { ViralRadarEngine } from '../lib/viral-radar-engine';

async function main() {
    console.log('🚀 Démarrage du Radar de Viralité Outfity 360');
    console.log('Objectif : Croiser TikTok, Pinterest et Google Trends');

    const engine = new ViralRadarEngine();

    try {
        await engine.runFullViralRadar();
        console.log('✅ Synchronisation terminée avec succès.');
    } catch (error) {
        console.error('❌ Erreur fatale lors du radar viral:', error);
        process.exit(1);
    }
}

main();
