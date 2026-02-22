
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- CONFIGURATION DU MOTEUR DE NOTATION ---

const SCORING_RULES = {
    // 1. Mots-clés POSITIFS (Boostent la tendance)
    // Ce sont les marqueurs de la mode actuelle (Streetwear, Y2K, Luxe discret)
    BONUS_KEYWORDS: [
        { word: 'oversize', points: 15 },
        { word: 'large', points: 10 },
        { word: 'boxy', points: 15 },
        { word: 'ample', points: 10 },
        { word: 'heavyweight', points: 20 }, // Très tendance (qualité)
        { word: 'lourd', points: 15 },
        { word: 'archive', points: 20 },
        { word: 'y2k', points: 15 },
        { word: 'vintage', points: 10 },
        { word: 'délavé', points: 10 },
        { word: 'wash', points: 10 },
        { word: 'carpenter', points: 15 }, // Pantalons cargo/carpenter très in
        { word: 'cargo', points: 10 },
        { word: 'parachute', points: 15 },
        { word: 'cuir', points: 15 }, // Matière noble
        { word: 'laine', points: 15 },
        { word: 'lin', points: 10 },
        { word: 'brodé', points: 10 }, // Mieux que imprimé
        { word: 'patch', points: 10 },
        { word: 'edition limitée', points: 25 },
        { word: 'collab', points: 20 }
    ],

    // 2. Mots-clés NÉGATIFS (Freinent la tendance)
    // Marqueurs de styles passés ou de basse qualité (Fast fashion générique)
    MALUS_KEYWORDS: [
        { word: 'slim', points: -20 }, // Le slim est mort pour l'instant
        { word: 'skinny', points: -30 }, // Encore pire
        { word: 'moulant', points: -15 },
        { word: 'super skinny', points: -35 },
        { word: 'basique', points: -5 }, // Pas mauvais, mais pas "Tendance"
        { word: 'lot de', points: -10 }, // Souvent du remplissage
        { word: 'multipack', points: -10 },
        { word: 'polyester', points: -5 }, // Matière cheap
        { word: 'intissé', points: -10 },
        { word: 'standard', points: -5 },
        { word: 'regular', points: -5 } // Trop neutre
    ],

    // 3. Marques "PREMIUM/HYPE" (Si détectées -> Bonus)
    HYPE_BRANDS: [
        'Carhartt', 'Dickies', 'Stussy', 'Nike NRG', 'Adidas Originals',
        'North Face', 'Arc\'teryx', 'Salomon', 'Diesel', 'Courrèges'
    ],

    // 4. Définition des COUPES (Pour le champ 'cut')
    CUT_KEYWORDS: [
        { word: 'oversize', tag: 'OVERSIZE' },
        { word: 'large', tag: 'LARGE' },
        { word: 'ample', tag: 'LARGE' },
        { word: 'baggy', tag: 'BAGGY' },
        { word: 'boxy', tag: 'BOXY' },
        { word: 'slim', tag: 'SLIM' },
        { word: 'skinny', tag: 'SKINNY' },
        { word: 'moulant', tag: 'MUSCLE FIT' },
        { word: 'droit', tag: 'DROIT' },
        { word: 'regular', tag: 'REGULAR' },
        { word: 'tapered', tag: 'FUSELÉ' },
        { word: 'cropped', tag: 'COURT' },
        { word: 'court', tag: 'COURT' }
    ]
};

async function calculateDailyTrends() {
    console.log('🤖 Démarrage du Moteur de Notation + Taggage Automatique (Style & Coupe)...');
    console.log('📅 Date du run :', new Date().toISOString());

    try {
        // 1. Récupérer tous les produits
        const products = await (prisma.trendProduct as any).findMany();
        console.log(`📦 Analyse de ${products.length} produits...`);

        let updatedCount = 0;

        for (const product of products) {
            let score = 50; // Score de départ (Neutre)
            const nameLower = product.name.toLowerCase();
            const details = []; // Pour le debug

            // --- AUTO-TAGGING (Détérminer le style dominant & la coupe) ---
            let rawCat = (product.category || 'AUTRE').toUpperCase();

            // Normalisation des anciennes catégories vers les nouveaux IDs techniques
            let normalizedCat = rawCat;
            if (/VESTE|JACKET|MANTEAU|BLOUSON/.test(rawCat)) normalizedCat = 'JACKEX';
            else if (/SWEAT|HOODIE|PULL|KNIT/.test(rawCat)) normalizedCat = 'SWEAT';
            else if (/PANTALON|PANT|CARGO|SHORT/.test(rawCat)) {
                if (/JEAN|DENIM/.test(nameLower)) normalizedCat = 'JEAN';
                else normalizedCat = 'PANT';
            }
            else if (/T-SHIRT|TSHIRT|TOP/.test(rawCat)) normalizedCat = 'TSHIRT';
            else if (/ROBE|DRESS|SKIRT|JUPE/.test(rawCat)) normalizedCat = 'DRESS';

            let detectedStyle = normalizedCat;
            let detectedCut = 'STANDARD'; // Coupe par défaut

            // A. DÉTECTION DE LA COUPE (Cut)
            for (const cutRule of SCORING_RULES.CUT_KEYWORDS) {
                if (nameLower.includes(cutRule.word)) {
                    detectedCut = cutRule.tag;
                    if (['OVERSIZE', 'BOXY', 'BAGGY'].includes(detectedCut)) break;
                }
            }

            // B. ANALYSE SÉMANTIQUE (Score & Style)
            let maxStylePoints = 0;

            // Bonus Keywords
            for (const rule of SCORING_RULES.BONUS_KEYWORDS) {
                if (nameLower.includes(rule.word)) {
                    score += rule.points;
                    details.push(`+${rule.points} (${rule.word})`);

                    const isPureCut = ['large', 'ample', 'oversize', 'slim', 'skinny', 'boxy'].includes(rule.word);
                    if (!isPureCut && rule.points >= maxStylePoints) {
                        // On prend le terme le plus précis pour le style (ex: CARPENTER)
                        detectedStyle = rule.word.charAt(0).toUpperCase() + rule.word.slice(1);
                        maxStylePoints = rule.points;
                    }
                }
            }

            // Overrides spécifiques pour des signatures Premium
            if (nameLower.includes('bomber')) detectedStyle = 'Bomber';
            else if (nameLower.includes('blazer')) detectedStyle = 'Blazer Premium';
            else if (nameLower.includes('varsity') || nameLower.includes('racing')) detectedStyle = 'Racing Jacket';
            else if (nameLower.includes('cargo')) detectedStyle = 'Cargo Wide';
            else if (nameLower.includes('carpenter')) detectedStyle = 'Carpenter';
            else if (nameLower.includes('baggy')) detectedStyle = 'Baggy Denim';
            else if (nameLower.includes('puffer')) detectedStyle = 'Puffer';
            else if (nameLower.includes('trench')) detectedStyle = 'Trench';
            else if (nameLower.includes('t-shirt') && nameLower.includes('boxy')) detectedStyle = 'Boxy';
            else if (nameLower.includes('hoodie')) detectedStyle = 'Hoodie Oversize';
            else if (nameLower.includes('imprimé') && nameLower.includes('dos')) detectedStyle = 'Back Print';
            else if (nameLower.includes('ensemble') || nameLower.includes('co-ord')) detectedStyle = 'Ensemble';

            // Malus Keywords
            for (const rule of SCORING_RULES.MALUS_KEYWORDS) {
                if (nameLower.includes(rule.word)) {
                    score += rule.points;
                    details.push(`${rule.points} (${rule.word})`);
                }
            }

            // C. Analyse Marque Hype
            for (const brand of SCORING_RULES.HYPE_BRANDS) {
                if (nameLower.includes(brand.toLowerCase()) || (product.brand && product.brand.toLowerCase().includes(brand.toLowerCase()))) {
                    score += 15;
                    details.push(`+15 (Marque Hype: ${brand})`);
                    break;
                }
            }

            // D. Analyse Prix
            if (product.averagePrice > 70) {
                score += 10;
                details.push('+10 (Prix Premium)');
            } else if (product.averagePrice < 15 && !nameLower.includes('accessoire') && !nameLower.includes('chaussette')) {
                score -= 10;
                details.push('-10 (Prix Suspect/Faible)');
            }


            // E. Bornage du Score (Min 10 pts, pas de max pour le momentum)
            score = Math.max(10, score);

            // --- F. LOGIQUE DE DÉCROISSANCE (DECAY) ---
            // Si le produit n'a pas été mis à jour (scrape) depuis plus de 22h, 
            // on applique une baisse dérisoire pour simuler la perte de vitesse 
            // et éviter le "+0%" permanent.
            const lastUpdate = new Date(product.updatedAt);
            const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 3600);

            let finalScore = score;
            if (hoursSinceUpdate > 22) {
                // On baisse de 0.2 point par rapport au score actuel en DB
                finalScore = Math.max(10, (product.trendScore || score) - 0.2);
                details.push(`-0.2 (Decay: pas de refresh depuis ${Math.round(hoursSinceUpdate)}h)`);
            }

            // G. Mise à jour DB
            // On vérifie si qqch a changé
            const currentCut = (product as any).cut || 'STANDARD';

            if (Math.abs((product.trendScore || 0) - finalScore) > 0.01 || product.style !== detectedStyle || currentCut !== detectedCut || product.category !== normalizedCat) {
                await (prisma.trendProduct as any).update({
                    where: { id: product.id },
                    data: {
                        category: normalizedCat, // Normalisation (ex: Veste -> JACKEX)
                        trendScore: finalScore,
                        trendScoreVisual: finalScore,
                        trendGrowthPercent: hoursSinceUpdate > 22 ? -0.2 : product.trendGrowthPercent,
                        style: detectedStyle, // La signature (ex: Bomber)
                        productSignature: detectedStyle, // Doublon par sécurité pour les composants qui utilisent l'un ou l'autre
                        cut: detectedCut // La coupe (ex: OVERSIZE)
                    }
                });
                updatedCount++;
            }
        }

        console.log(`✨ Terminé ! ${updatedCount} produits analysés (Score, Style & Coupe).`);

    } catch (error) {
        console.error('❌ Erreur critique:', error);
    } finally {
        await prisma.$disconnect();
    }
}

calculateDailyTrends();
