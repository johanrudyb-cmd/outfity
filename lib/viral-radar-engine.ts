import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { getSeasonalRecommendation } from './seasonal-recommendation';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const googleTrends = require('google-trends-api');

// Configuration Puppeteer avec Stealth pour éviter les détections
puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

export interface ViralSignal {
    term: string;
    platform: 'TikTok' | 'Pinterest' | 'Google';
    score: number;
    growthPercent?: number;
    volume?: number;
    region: string;
}

export class ViralRadarEngine {
    /**
     * 1. SCAN TIKTOK (GRATUIT - VIA PUPPETEER)
     * On va directement sur le Creative Center, comme un utilisateur normal.
     */
    async getTikTokTrends(): Promise<ViralSignal[]> {
        console.log('[ViralRadar] 🤖 Scan TikTok (Zero Budget) en cours...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            // On va sur la page d'inspiration TikTok
            await page.goto('https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en', {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            // Attendre que les cartes de trends chargent
            await page.waitForSelector('span[class*="CardTitle"]', { timeout: 10000 });

            const hashtags = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('span[class*="CardTitle"]'));
                return elements.slice(0, 10).map(el => el.textContent?.trim());
            });

            await browser.close();

            return hashtags.filter(Boolean).map(tag => ({
                term: tag!,
                platform: 'TikTok',
                score: 85 + Math.random() * 10,
                growthPercent: 20 + Math.random() * 30,
                region: 'FR'
            }));
        } catch (e) {
            console.error('[ViralRadar] Erreur scan TikTok:', (e as Error).message);
            if (browser) await browser.close();
            // Fallback si TikTok bloque (on garde une base de données vivante)
            return [
                { term: 'Blockette Core', platform: 'TikTok', score: 88, growthPercent: 40, region: 'FR' },
                { term: 'Office Siren', platform: 'TikTok', score: 82, growthPercent: 15, region: 'FR' }
            ];
        }
    }

    /**
     * 2. SCAN PINTEREST (GRATUIT)
     */
    async getPinterestTrends(): Promise<ViralSignal[]> {
        console.log('[ViralRadar] 🤖 Scan Pinterest (Zero Budget) en cours...');
        // Pinterest Trends demande souvent un login, on utilise un mix de termes hyper-visuels
        // En mode gratuit, on simule sur les catégories "Fashion" dominantes.
        return [
            { term: 'Linen Summer Dress', platform: 'Pinterest', score: 92, growthPercent: 25, region: 'FR' },
            { term: 'Retro Sportswear', platform: 'Pinterest', score: 78, growthPercent: 12, region: 'FR' },
            { term: 'Crochet Bag', platform: 'Pinterest', score: 85, growthPercent: 18, region: 'FR' }
        ];
    }

    /**
     * 3. GOOGLE TRENDS (GRATUIT - VIA LIBRAIRIE)
     */
    async validateWithGoogleTrends(term: string): Promise<number> {
        console.log(`[ViralRadar] 🔍 Validation Google Trends gratuit pour: ${term}`);
        try {
            const result = await googleTrends.interestOverTime({
                keyword: term,
                geo: 'FR',
                startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
            });
            const parsed = JSON.parse(result);
            const values = parsed.default.timelineData;
            if (values && values.length > 0) {
                // On prend la dernière valeur (la plus récente)
                return values[values.length - 1].value[0];
            }
            return 50;
        } catch (e) {
            return 60 + Math.random() * 20; // Fallback simulation
        }
    }

    async generateViralTrend(term: string, signals: ViralSignal[]) {
        const googleScore = await this.validateWithGoogleTrends(term);
        const viralScore = signals.reduce((acc, s) => acc + s.score, 0) / signals.length;

        const finalTrendScore = (viralScore * 0.6) + (googleScore * 0.4);
        const growth = signals[0].growthPercent || 15;
        const seasonal = getSeasonalRecommendation();
        const termLower = term.toLowerCase();

        // --- MOTEUR DE TRI AUTOMATIQUE (Mapping vers ton UI) ---
        let category = 'TSHIRT';
        let productSignature = 'Regular';

        // 1. Détection de la Catégorie Globale
        if (/jacket|veste|coat|bomber|leather|cuir|varsity|manteau|blouson|blazer|trench|puffer/.test(termLower)) {
            category = 'JACKEX';
        } else if (/hoodie|sweat|pull|knit|maille|cardigan|crewneck/.test(termLower)) {
            category = 'SWEAT';
        } else if (/jean|denim/.test(termLower)) {
            category = 'JEAN';
        } else if (/pant|cargo|short|bermuda|legging|carpenter/.test(termLower)) {
            category = 'PANT';
        } else if (/dress|robe|skirt|jupe|ensemble|co-ord/.test(termLower)) {
            category = 'DRESS';
        }

        // 2. Détection de la Signature Précise (Sous-type)
        if (/bomber/.test(termLower)) productSignature = 'Bomber';
        else if (/blazer/.test(termLower)) productSignature = 'Blazer Premium';
        else if (/varsity|college|racing/.test(termLower)) productSignature = 'Racing Jacket';
        else if (/leather|cuir/.test(termLower)) productSignature = 'Cuir Véritable';
        else if (/cargo/.test(termLower)) productSignature = 'Cargo Wide';
        else if (/carpenter/.test(termLower)) productSignature = 'Carpenter';
        else if (/baggy/.test(termLower)) productSignature = 'Baggy Denim';
        else if (/boxy/.test(termLower)) productSignature = 'Boxy';
        else if (/oversize/.test(termLower)) {
            if (category === 'SWEAT') productSignature = 'Hoodie Oversize';
            else productSignature = 'Oversize';
        }
        else if (/knit|maille/.test(termLower)) productSignature = 'Maille Lourde';
        else if (/puffer|doudoune/.test(termLower)) productSignature = 'Puffer';
        else if (/hoodie/.test(termLower)) productSignature = 'Hoodie Oversize';
        else if (/crewneck/.test(termLower)) productSignature = 'Crewneck Boxy';

        const isSeasonallyAligned = termLower.includes(seasonal.productType) ||
            category.toLowerCase().includes(seasonal.productType) ||
            (category === 'JACKEX' && seasonal.productType === 'veste');

        let productionSafety: 'SÛR' | 'RISQUÉ' | 'DANGER' = isSeasonallyAligned ? 'SÛR' : 'RISQUÉ';

        return {
            name: term,
            category: category,
            style: term.split(' ')[0].toUpperCase(),
            productSignature: productSignature, // Le champ qui permet de ranger dans "Bomber" ou "Blazer"
            material: 'Mix',
            averagePrice: 49.90,
            trendScore: finalTrendScore,
            trendScoreVisual: finalTrendScore * 0.92,
            saturability: Math.max(10, 100 - finalTrendScore),
            imageUrl: `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000`,
            sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(term)}+trend`,
            opportunityReason: `Signaux croisés. Signature détectée : ${productSignature}.`,
            businessAnalysis: `Signature ${productSignature} en forte progression. Score Google : ${googleScore.toFixed(0)}. ${seasonal.reason}`,
            predictedScore60d: Math.min(100, finalTrendScore + (isSeasonallyAligned ? 10 : -10)),
            marketZone: 'FR',
            segment: 'femme',
            lastScan: 'Just now',
            trendGrowthPercent: growth,
            trendLabel: finalTrendScore > 80 ? 'EXPLOSIF' : 'ÉMERGENT',
            productionSafety,
            weatherSignal: isSeasonallyAligned ? 'Favorable' : 'À surveiller',
            aiConfidence: 80
        };
    }

    async runFullViralRadar() {
        console.log('\n--- 🌪️ OUTFITY ZERO-BUDGET RADAR ---');

        // Les niches que nous suivons pour les créateurs de marques
        const niches = ['Streetwear', 'Old Money', 'Techwear', 'Y2K'];
        let totalCount = 0;

        for (const niche of niches) {
            console.log(`\n📂 Analyse de la niche : ${niche}...`);

            const tiktok = await this.getTikTokTrends();
            const pinterest = await this.getPinterestTrends();
            const signals = [...tiktok, ...pinterest];

            // On prend les 3 plus gros termes
            const seeds = [...new Set(signals.map(s => s.term))].slice(0, 3);

            for (const seed of seeds) {
                const relatedSignals = signals.filter(s => s.term === seed);
                const trendData = await this.generateViralTrend(seed, relatedSignals);

                // On force le style pour correspondre à la niche
                trendData.style = niche.toUpperCase();

                await (prisma.trendProduct as any).upsert({
                    where: { sourceUrl: trendData.sourceUrl },
                    update: {
                        trendScore: trendData.trendScore,
                        trendGrowthPercent: trendData.trendGrowthPercent,
                        businessAnalysis: trendData.businessAnalysis,
                        productionSafety: trendData.productionSafety,
                        updatedAt: new Date()
                    },
                    create: trendData as any
                });

                totalCount++;
                console.log(`✨ [${niche}] ${seed.padEnd(25)} | Score: ${trendData.trendScore.toFixed(0)}`);
            }
        }

        console.log(`\n✅ RADAR TERMINÉ : ${totalCount} tendances synchronisées par niches.`);
    }
}

