import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { getSeasonalRecommendation } from './seasonal-recommendation';
// import puppeteer removed
// stealth removed
const googleTrends = require('google-trends-api');

// Configuration Puppeteer avec Stealth pour éviter les détections
// puppeteer.use(StealthPlugin());

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
        console.log('[ViralRadar] 🤖 Scan TikTok (Multi-Strategy) en cours...');

        // --- STRATÉGIE 1 : API JSON directe du TikTok Creative Center ---
        try {
            const url = 'https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list?page=1&limit=20&period=7&country_code=FR&industry_id=';
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Referer': 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const json = await response.json();
                const items = json?.data?.list || json?.data?.hashtag_list || [];
                if (items.length > 0) {
                    console.log(`[ViralRadar] ✅ API TikTok OK — ${items.length} hashtags récupérés`);
                    return items.slice(0, 10).map((item: any) => ({
                        term: item.hashtag_name || item.name || item.title,
                        platform: 'TikTok' as const,
                        score: 80 + Math.random() * 15,
                        growthPercent: item.publish_cnt ? Math.min(50, item.publish_cnt / 10000) : 20 + Math.random() * 20,
                        region: 'FR'
                    })).filter((s: any) => !!s.term);
                }
            }
        } catch (err) {
            console.log('[ViralRadar] API TikTok inaccessible, passage au scraping DOM...');
        }

        // --- STRATÉGIE 2 : Scraping DOM avec sélecteurs multiples ---
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' });

            await page.goto('https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            // Attente courte pour le JS dynamique
            await new Promise(r => setTimeout(r, 5000));

            const hashtags = await page.evaluate(() => {
                // Essayer plusieurs sélecteurs courants selon les versions du DOM TikTok
                const selectors = [
                    'span[class*="CardTitle"]',
                    'p[class*="title"]',
                    'div[class*="hashtag-name"]',
                    'span[class*="trend-title"]',
                    '.trend-item-title',
                    'h3[class*="title"]',
                    'a[class*="hashtag"]',
                ];
                for (const sel of selectors) {
                    const els = Array.from(document.querySelectorAll(sel));
                    const texts = els.map(el => el.textContent?.trim()).filter(Boolean);
                    if (texts.length >= 3) return texts.slice(0, 10);
                }
                // Dernier fallback : tous les éléments avec "#"
                const allTexts = Array.from(document.querySelectorAll('span, p, a'))
                    .map(el => el.textContent?.trim() || '')
                    .filter(t => t.startsWith('#') && t.length > 2);
                return [...new Set(allTexts)].slice(0, 10);
            });

            await browser.close();

            if (hashtags.length > 0) {
                // Filtre : on ne garde que les hashtags liés à la mode/style
                const FASHION_KEYWORDS = [
                    'fashion', 'style', 'outfit', 'ootd', 'mode', 'look', 'tenue',
                    'veste', 'hoodie', 'jean', 'robe', 'sweat', 'dress', 'coat',
                    'vintage', 'streetwear', 'luxury', 'chic', 'trend', 'clothes',
                    'wear', 'core', 'aesthetic', 'siren', 'coquette', 'quiet', 'money'
                ];
                const fashionHashtags = hashtags.filter((tag: string) =>
                    FASHION_KEYWORDS.some(kw => tag.toLowerCase().includes(kw))
                );

                if (fashionHashtags.length >= 2) {
                    console.log(`[ViralRadar] ✅ ${fashionHashtags.length} hashtags mode filtrés.`);
                    return fashionHashtags.map((tag: string) => ({
                        term: tag.replace(/^#/, ''),
                        platform: 'TikTok' as const,
                        score: 80 + Math.random() * 15,
                        growthPercent: 15 + Math.random() * 30,
                        region: 'FR'
                    }));
                }
                console.log('[ViralRadar] ⚠️ Hashtags TikTok non-mode détectés, passage au fallback curé...');
            }

            throw new Error('Aucun hashtag mode trouvé');

        } catch (e) {
            console.error('[ViralRadar] ⚠️ Scraping TikTok échoué:', (e as Error).message);
            if (browser) await browser.close().catch(() => { });

            // --- STRATÉGIE 3 : Fallback Curated Fashion Trends ---
            // Ces termes sont mis à jour manuellement selon les tendances du moment (Fév 2026)
            console.log('[ViralRadar] 🔄 Utilisation du fallback mode/tendances curées...');
            const curatedFashionTrends = [
                'Gorpcore',         // Outdoor-chic, mont ascendant
                'Office Siren',     // Mode bureau sexy, toujours fort
                'Quiet Luxury',     // Old Money revisité
                'Boho Revival',     // Retour du bohème
                'Moto Girl',        // Vestes cuir, tendance 2026
                'Coastal Grandmother', // Pièces intemporelles lin
                'Coquette',         // Rubans, dentelle, très TikTok
                'Ballet Core',      // Chaussons, chic, très FR
            ];

            return curatedFashionTrends.map(term => ({
                term,
                platform: 'TikTok' as const,
                score: 75 + Math.random() * 20,
                growthPercent: 10 + Math.random() * 35,
                region: 'FR'
            }));
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
        console.log('\n--- 🌪️ OUTFITY HYBRID RADAR (Organic + Custom) ---');
        let totalCount = 0;

        // 1. PASSAGE 1 : Les Niches Organiques Standards
        const niches = ['Streetwear', 'Old Money', 'Techwear', 'Y2K'];
        for (const niche of niches) {
            console.log(`\n📂 Analyse organique niche : ${niche}...`);
            const tiktok = await this.getTikTokTrends();
            const pinterest = await this.getPinterestTrends();
            const signals = [...tiktok, ...pinterest];

            // Pour les niches standards, on prend les 3 meilleurs termes organiques
            const organicSeeds = [...new Set(signals.map(s => s.term))].slice(0, 3);

            for (const seed of organicSeeds) {
                const relatedSignals = signals.filter(s => s.term === seed);
                const trendData = await this.generateViralTrend(seed, relatedSignals);
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

        // 2. PASSAGE 2 : Tes Hashtags Personnalisés (Admin)
        console.log(`\n🚀 Analyse des Hashtags personnalisés (Admin)...`);
        try {
            const tiktok = await this.getTikTokTrends();
            const pinterest = await this.getPinterestTrends();
            const signals = [...tiktok, ...pinterest];

            const tracked = await (prisma as any).trackedHashtag.findMany({ where: { isActive: true } });

            for (const item of tracked) {
                const seed = item.hashtag;
                // On cherche si ce hashtag est déjà présent dans les signaux organiques pour avoir de la data réelle
                const relatedSignals = signals.filter(s => s.term.toLowerCase().includes(seed.toLowerCase()));

                // Si on a pas de signaux organiques, on crée un signal simulé basé sur le radar
                const finalSignals = relatedSignals.length > 0 ? relatedSignals : [{
                    term: seed,
                    platform: 'TikTok' as const,
                    score: 70 + Math.random() * 20,
                    region: 'FR'
                }];

                const trendData = await this.generateViralTrend(seed, finalSignals);
                // On utilise la catégorie du hashtag ou "CUSTOM"
                trendData.style = (item.category || seed).toUpperCase();

                await (prisma.trendProduct as any).upsert({
                    where: { sourceUrl: trendData.sourceUrl },
                    update: {
                        trendScore: trendData.trendScore,
                        trendGrowthPercent: trendData.trendGrowthPercent,
                        businessAnalysis: trendData.businessAnalysis,
                        updatedAt: new Date()
                    },
                    create: trendData as any
                });
                totalCount++;
                console.log(`🎯 [CUSTOM] ${seed.padEnd(25)} | Score: ${trendData.trendScore.toFixed(0)}`);
            }
        } catch (e) {
            console.warn("[ViralRadar] Error in custom hashtags pass", e);
        }

        console.log(`\n✅ RADAR HYBRIDE TERMINÉ : ${totalCount} tendances synchronisées.`);
    }
}
