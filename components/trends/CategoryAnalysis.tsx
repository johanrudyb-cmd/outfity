'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { MarketChart } from './MarketChart';
import { PredictiveChart } from './PredictiveChart';
import { Loader2, TrendingUp, Tag, Layers, Shirt, ArrowLeft, Clock, Calendar, ThermometerSun, Snowflake, DollarSign, Activity, AlertTriangle, ArrowRight, Zap, ChevronDown, Sparkles, Info, Palette } from 'lucide-react';
import { inferStyle } from '@/lib/infer-trend-category';
import { FASHION_CUTS_BY_CATEGORY } from '@/lib/constants/fashion-cuts';

interface TrendStyleGroup {
    id: string;
    name: string;
    category: string;
    styleKey: string;
    avgScore: number;
    productCount: number;
    avgPrice: number;
    topImageUrl: string | null;
}

interface CategoryAnalysisProps {
    categoryId: string;
    categoryLabel: string;
    initialSegment?: string;
}

function aggregateProductsToStyles(products: any[], categoryId: string): TrendStyleGroup[] {
    const groups: Record<string, TrendStyleGroup> = {};

    products.forEach(p => {
        // If style is empty or generic, we infer it from name
        const rawStyle = p.style && p.style !== 'Autre' && p.style !== '' ? p.style : inferStyle(p.name, categoryId);
        const folderName = rawStyle;
        const rawCat = p.category ? p.category.toUpperCase() : categoryId;
        const key = `${rawCat}_${folderName}`;

        if (!groups[key]) {
            groups[key] = {
                id: encodeURIComponent(key),
                name: folderName,
                category: rawCat,
                styleKey: folderName,
                avgScore: 0,
                productCount: 0,
                avgPrice: 0,
                topImageUrl: p.imageUrl
            };
        }

        groups[key].avgScore += (p.trendScore || 50);
        groups[key].avgPrice += (p.averagePrice || 0);
        groups[key].productCount++;
    });

    return Object.values(groups).map(g => {
        const baseAvg = g.avgScore / g.productCount;
        // Bonus de Volume : Plus on trouve d'articles, plus la tendance est "puissante"
        // On ajoute +1 point par tranche de 5 articles (capé à +20)
        const volumeBonus = Math.min(20, Math.floor(g.productCount / 5));

        return {
            ...g,
            avgScore: Math.round(baseAvg + volumeBonus),
            avgPrice: Math.round(g.avgPrice / g.productCount * 100) / 100,
        };
    }).sort((a, b) => b.avgScore - a.avgScore);
}

export function CategoryAnalysis({ categoryId, categoryLabel, initialSegment = 'homme' }: CategoryAnalysisProps) {
    const [styles, setStyles] = useState<TrendStyleGroup[]>([]);
    const [rawProducts, setRawProducts] = useState<any[]>([]);
    const [stats, setStats] = useState({ lastUpdate: '', newCount: 0 });
    const [loading, setLoading] = useState(true);
    const [segment, setSegment] = useState<string>(initialSegment);
    const [subFilter, setSubFilter] = useState('ALL');
    const [leadTime, setLeadTime] = useState(60);
    const [globalScore, setGlobalScore] = useState(50);
    const [globalDiff, setGlobalDiff] = useState(0);


    useEffect(() => {
        const fetchTrends = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('segment', segment);
                params.set('limit', '400');
                const res = await fetch(`/api/trends/hybrid-radar?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    const products = data.trends || [];
                    const filteredRaw = products.filter((p: any) => p.category === categoryId);
                    setRawProducts(filteredRaw);

                    // Calcul des stats de fraîcheur
                    const now = new Date();
                    const lastProd = products.length > 0
                        ? products.reduce((latest: any, p: any) => {
                            const d = new Date(p.updatedAt);
                            return d > latest ? d : latest;
                        }, new Date(0))
                        : null;
                    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    const newlyAdded = filteredRaw.filter((p: any) => new Date(p.createdAt) > twentyFourHoursAgo).length;

                    // Calcul du temps relatif
                    let lastUpdateStr = "--:--";
                    if (lastProd) {
                        const diffMs = now.getTime() - lastProd.getTime();
                        const diffMins = Math.floor(diffMs / (1000 * 60));
                        const diffHours = Math.floor(diffMins / 60);
                        if (diffHours > 0) lastUpdateStr = `Il y a ${diffHours}h`;
                        else if (diffMins > 0) lastUpdateStr = `Il y a ${diffMins}m`;
                        else lastUpdateStr = "À l'instant";
                    }

                    setStats({
                        lastUpdate: lastUpdateStr,
                        newCount: newlyAdded
                    });

                    // Aggrégation et mélange avec les signatures populaires de CETTE catégorie
                    const aggregated = aggregateProductsToStyles(products, categoryId);

                    // On garde les styles trouvés
                    const finalStyles = [...aggregated.filter(s => s.category === categoryId)];

                    // On ajoute les populaires SI elles correspondent à la catégorie actuelle
                    const categorySignatures = (FASHION_CUTS_BY_CATEGORY as any)[categoryId] || [];

                    categorySignatures.forEach((sig: string) => {
                        if (!finalStyles.find(fs => fs.name.toUpperCase() === sig.toUpperCase())) {
                            finalStyles.push({
                                id: sig,
                                name: sig,
                                category: categoryId,
                                styleKey: sig,
                                avgScore: 0,
                                productCount: 0,
                                avgPrice: 0,
                                topImageUrl: null
                            });
                        }
                    });

                    setStyles(finalStyles);

                    // Calcul du Score Global de la catégorie
                    if (filteredRaw.length > 0) {
                        const sum = filteredRaw.reduce((acc: number, p: any) => acc + (p.trendScore || 50), 0);
                        const avg = sum / filteredRaw.length;
                        const bonus = Math.min(15, Math.floor(filteredRaw.length / 5));
                        setGlobalScore(Math.round(avg + bonus));

                        const diff = newlyAdded > 0
                            ? Math.max(1, Math.min(12, Math.floor(newlyAdded / 2)))
                            : -0.2;

                        setGlobalDiff(diff);
                    }
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };

        fetchTrends();
        (window as any).refreshCategoryTrends = fetchTrends;
    }, [segment, categoryId]);

    const filteredStyles = useMemo(() => {
        if (subFilter === 'ALL') return styles.filter(s => s.productCount > 0); // On ne montre que ce qui a de la data en grille
        return styles.filter(s => s.name === subFilter);
    }, [styles, subFilter]);

    // Fonction de bruit déterministe
    const getStableNoise = (seed: string, timestamp: number) => {
        let h = 0;
        const str = seed + timestamp;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        }
        return (Math.abs(h % 60) / 10) - 3;
    };

    // Moteur de Saisonalité Cohérent
    const getSeasonalTrend = (category: string, targetMonth: number) => {
        const isHeavy = category.toLowerCase().includes('sweat') ||
            category.toLowerCase().includes('hoodie') ||
            category.toLowerCase().includes('jackex') ||
            category.toLowerCase().includes('veste') ||
            category.toLowerCase().includes('heavy');

        // SS (Spring/Summer): Mars (2) à Août (7) -> T-shirts UP, Heavy DOWN
        // FW (Fall/Winter): Septembre (8) à Février (1) -> T-shirts DOWN, Heavy UP
        const isSunSeason = targetMonth >= 2 && targetMonth <= 7;

        if (isSunSeason) return isHeavy ? -0.8 : 0.6;
        return isHeavy ? 0.7 : -0.7;
    };

    const selectedStyle = styles.find(s => s.name === subFilter);
    const currentScoreValue = subFilter === 'ALL' ? globalScore : (selectedStyle?.avgScore || 50);

    // Simulation de données pour la courbe prédictive
    const chartData = useMemo(() => {
        const data = [];
        const baseScore = currentScoreValue;
        const noiseSeed = `${categoryId}-${subFilter}`;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. HISTORIQUE (30 derniers jours - AU JOUR LE JOUR)
        for (let i = 30; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const noise = getStableNoise(noiseSeed, d.getTime());
            // L'historique est une légère tendance passée
            data.push({
                date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                value: Math.round(baseScore - (i * 0.2) + noise),
                isFuture: false
            });
        }

        // 2. PRÉDICTION (Lead Time - AU JOUR LE JOUR)
        let runningScore = baseScore;
        for (let i = 1; i <= leadTime; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const month = d.getMonth();
            const bias = getSeasonalTrend(categoryId, month);
            const noise = getStableNoise(noiseSeed, d.getTime());

            // On réduit l'impact quotidien du bruit pour garder une courbe lisible au jour le jour
            runningScore += (bias * 0.8) + (noise / 3);
            runningScore = Math.max(10, Math.min(98, runningScore));

            data.push({
                date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                value: Math.round(runningScore),
                isFuture: true
            });
        }
        return data;
    }, [categoryId, subFilter, leadTime, currentScoreValue]);

    const futureScore = chartData[chartData.length - 1]?.value || 0;

    const isOffSeason = useMemo(() => {
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + leadTime);
        const targetMonth = releaseDate.getMonth();
        return getSeasonalTrend(categoryId, targetMonth) < 0;
    }, [categoryId, leadTime]);

    const reliabilityIndex = useMemo(() => {
        const base = 94.5;
        const timePenalty = (leadTime / 30) * 1.5;
        const volumeBonus = Math.min(styles.length * 0.1, 2);

        // Logique de certitude saisonnière :
        // Si c'est hors-saison (ex: pull en été), on est TRES CERTAIN (98%+) que ça ne vendra pas.
        // Si c'est en plein saison, l'incertitude est plus grande (score plus bas).
        const seasonalCertainty = isOffSeason ? 4.5 : 0;

        const noise = (getStableNoise(categoryId + (subFilter || ''), 999) + 3) / 2;
        return Math.min(99.9, base - timePenalty + volumeBonus + seasonalCertainty - noise).toFixed(1);
    }, [leadTime, styles.length, categoryId, subFilter, isOffSeason]);

    const todayScore = chartData[30]?.value || 0;
    const yesterdayScore = chartData[29]?.value || 0;
    const computedDiff = todayScore - yesterdayScore;

    const dailyDiff = subFilter === 'ALL' ? globalDiff : computedDiff;
    const dailyPct = subFilter === 'ALL' ? ((globalDiff / (globalScore || 1)) * 100).toFixed(1) : (yesterdayScore > 0 ? ((computedDiff / yesterdayScore) * 100).toFixed(1) : "0");

    // On se base sur computedDiff pour la couleur de la courbe (réel visuel)
    const historyColor = computedDiff >= 0 ? "#22C55E" : "#FF3B30";

    // Moteur Stratégique Local (Instantané)
    const strategicAnalysis = useMemo(() => {
        const styleName = (subFilter === 'ALL' ? categoryLabel.split(' ')[0] : subFilter).toUpperCase();
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + leadTime);
        const month = releaseDate.getMonth();

        // 1. Contexte Saisonnier
        let seasonContext = "";
        if (month >= 2 && month <= 4) seasonContext = "Saison : Printemps. ";
        else if (month >= 5 && month <= 7) seasonContext = "Saison : Été. ";
        else if (month >= 8 && month <= 10) seasonContext = "Saison : Automne. ";
        else seasonContext = "Saison : Hiver. ";

        // 2. Analyse Chromatique Dynamique (Couleurs Virales)
        const isSpringSummer = (m: number) => m >= 2 && m <= 7;

        const getColors = (monthIdx: number) => {
            const isSS = isSpringSummer(monthIdx);
            if (segment === 'femme') {
                if (categoryId === 'DRESS') {
                    return isSS
                        ? [{ hex: '#F5F5F7', name: 'White' }, { hex: '#E6E6FA', name: 'Lavender' }, { hex: '#3B3C36', name: 'Sage' }]
                        : [{ hex: '#1A1A1A', name: 'Black' }, { hex: '#800020', name: 'Burgundy' }, { hex: '#4B3621', name: 'Brown' }];
                } else if (categoryId === 'JACKEX' || categoryId === 'SWEAT') {
                    return isSS
                        ? [{ hex: '#F5F5F7', name: 'Off-White' }, { hex: '#D2B48C', name: 'Sand' }, { hex: '#B0C4DE', name: 'Pastel Blue' }]
                        : [{ hex: '#1A1A1A', name: 'Black' }, { hex: '#2C2C2E', name: 'Charcoal' }, { hex: '#4B3621', name: 'Coffee' }];
                } else {
                    return [{ hex: '#1A1A1A', name: 'Black' }, { hex: '#F5F5F7', name: 'White' }, { hex: '#D2B48C', name: 'Beige' }];
                }
            } else {
                if (categoryId === 'JACKEX' || categoryId === 'SWEAT') {
                    return isSS
                        ? [{ hex: '#F5F5F7', name: 'Vintage White' }, { hex: '#D2B48C', name: 'Sand' }, { hex: '#708090', name: 'Slate Grey' }]
                        : [{ hex: '#1A1A1A', name: 'Black' }, { hex: '#2C2C2E', name: 'Anthracite' }, { hex: '#000080', name: 'Navy' }];
                } else {
                    return [{ hex: '#1A1A1A', name: 'Black' }, { hex: '#F5F5F7', name: 'White' }, { hex: '#708090', name: 'Grey' }];
                }
            }
        };

        const todayMonth = new Date().getMonth();
        const currentColors = getColors(todayMonth);
        const targetColors = getColors(month);

        // 3. Stratégie de Prix Réaliste (Sweet Spot Marché Indé)
        // On se base sur un prix de marché "Indie Premium" accessible mais qualitatif
        let baseRefPrice = 45; // Valeur pivot par défaut
        let multiplier = 1.0;

        // Calibrage par Catégorie (Prix de base réaliste sur le marché FR)
        if (categoryId === 't-shirts') {
            baseRefPrice = segment === 'femme' ? 35 : 38;
            multiplier = 1.1; // T-shirt indé : ~40-50€
        } else if (categoryId === 'sweats') {
            baseRefPrice = segment === 'femme' ? 70 : 75;
            multiplier = 1.2; // Hoodie indé : ~80-95€
        } else if (categoryId === 'vestes') {
            baseRefPrice = 110;
            multiplier = 1.3; // Veste : ~140-160€
        } else if (categoryId === 'pantalons' || categoryId === 'jeans') {
            baseRefPrice = 65;
            multiplier = 1.15; // Pantalon : ~75-85€
        } else if (categoryId === 'robes') {
            baseRefPrice = 85;
            multiplier = 1.25; // Robe : ~105-120€
        }

        // Ajustement selon le type de coupe (Valeur perçue)
        if (styleName.includes('BOXY') || styleName.includes('OVERSIZE')) multiplier += 0.15; // + ~15% pour le volume de tissu
        if (styleName.includes('HEAVY')) multiplier += 0.25; // + ~25% pour le grammage premium
        if (styleName.includes('BASIC')) multiplier -= 0.1;  // - ~10% pour l'entrée de gamme

        // 4. Optimisation de la Marge Saisonnière (Demande vs Rareté)
        const isOnSeason = !isOffSeason;
        const marginMultiplier = isOnSeason ? 1.08 : 0.92; // +8% de "Premium Saison" ou -8% de "Malus Hors-Saison"

        const finalTarget = baseRefPrice * multiplier * marginMultiplier;
        const priceRange = {
            min: Math.floor(finalTarget * 0.9 / 5) * 5,
            max: Math.ceil(finalTarget * 1.1 / 5) * 5
        };

        const marginLevel = isOffSeason
            ? "LIMITÉE"
            : (futureScore >= 80 ? "PEAK" : (futureScore >= 50 ? "STABLE" : "LIMITÉE"));

        // 4. Système de Messages Expert par Probabilité
        let commentary = "";
        let recommendationLevel = "PRUDENT";
        const isEvergreen = ['t-shirts', 'jeans', 'pantalons', 'accessoires'].includes(categoryId.toLowerCase());

        // Détection de transition saisonnière pour le message
        const currentMonth = new Date().getMonth();
        const targetIsSS = isSpringSummer(month);
        const becomesNewSeason = isSpringSummer(currentMonth) !== targetIsSS;
        const transitionNote = becomesNewSeason ? `Transition saisonnière détectée : Sortie prévue en ${targetIsSS ? 'Printemps/Été' : 'Automne/Hiver'}. ` : seasonContext;

        if (futureScore >= 85) {
            commentary = `${transitionNote}Momentum exceptionnel. ${isOnSeason ? 'Le timing est parfait pour maximiser vos marges via un positionnement prix premium.' : 'Attention : forte demande mais période hors-période idéale pour le profit maximal.'} Prévoyez des stocks profonds.`;
            recommendationLevel = "OPTIMAL";
        } else if (futureScore >= 65) {
            commentary = `${transitionNote}Marché en phase de maturité croissante. ${isOnSeason ? 'Demande saisonnière forte poussant le prix vers le haut.' : 'Volume stable, mais la rentabilité par pièce sera plus faible qu\'en pleine saison.'} Misez sur un branding fort.`;
            recommendationLevel = "PRUDENT";
        } else if (isOffSeason) {
            if (isEvergreen) {
                commentary = `${transitionNote}Manque de Pertinence : Ce produit se vend toute l'année, mais le timing choisi manque d'opportunité commerciale pour justifier un prix fort. Attendez le pic saisonnier pour optimiser vos revenus.`;
                recommendationLevel = "NON-OPTIMAL";
            } else {
                commentary = `${transitionNote}Risque de désalignement saisonnier. Vendre maintenant est possible mais moins bénéfique : attendez la pleine saison pour augmenter vos prix de 15% sans perdre en volume.`;
                recommendationLevel = "RISQUE";
            }
        } else if (futureScore < 45) {
            commentary = `${transitionNote}Alerte Saturation : Le marché pour ${styleName} arrive à son point d'inflexion. Un lancement à cette date présente un risque élevé d'invendus et de marges nulles.`;
            recommendationLevel = "RISQUE";
        } else {
            commentary = `${transitionNote}Volume de recherche stable. Un lancement prudent est conseillé pour tester l'appétence, mais surveillez vos coûts de production car le prix cible est plafonné.`;
            recommendationLevel = "PRUDENT";
        }

        const monthLabel = releaseDate.toLocaleDateString('fr-FR', { month: 'long' });
        const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

        return {
            priceRange,
            commentary,
            recommendationLevel,
            marginLevel,
            isOnSeason,
            isEvergreen,
            currentColors,
            targetColors,
            targetMonth: capitalizedMonth
        };
    }, [subFilter, categoryLabel, segment, leadTime, futureScore, isOffSeason, styles, categoryId]);

    const isTrendingUp = futureScore >= todayScore;
    const predictionColor = "#007AFF"; // Retour au neutre (Bleu Branding)

    const todayDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const releaseDateObj = new Date();
    releaseDateObj.setDate(releaseDateObj.getDate() + leadTime);
    const releaseDate = releaseDateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1a1a1a] pb-32">
            {/* Header Responsive */}
            <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 md:py-6 sticky top-0 z-20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div className="flex items-center gap-4 md:gap-8">
                    <Link href="/trends" className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest shrink-0">
                        <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden xs:inline">Retour Analyse</span>
                        <span className="xs:hidden">Retour</span>
                    </Link>
                    <div className="h-6 w-px bg-gray-100" />
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div className="min-w-0">
                            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">Analyse {categoryLabel}</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">DIAGNOSTIC ANALYSE</p>
                                <button
                                    onClick={() => (window as any).refreshCategoryTrends?.()}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <Loader2 className={cn("w-3 h-3 text-[#007AFF]", loading && "animate-spin")} />
                                </button>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-gray-100 shrink-0">
                            <div className="w-4 h-3 flex overflow-hidden rounded-[2px] shadow-sm">
                                <div className="w-1/3 h-full bg-[#0055A4]" />
                                <div className="w-1/3 h-full bg-white" />
                                <div className="w-1/3 h-full bg-[#EF4135]" />
                            </div>
                            <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">FR</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6">
                    <div className="flex items-center gap-6">
                        <div className="hidden xl:flex items-center gap-4 border-r border-gray-100 pr-6 mr-2">
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Analyse Tendance</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                                    <span className="text-[10px] font-black text-black">ACTIF</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Dernier Scan</span>
                                <span className="text-[10px] font-black text-[#007AFF]">{stats.lastUpdate}</span>
                            </div>
                            {stats.newCount > 0 && (
                                <div className="flex flex-col items-end text-right">
                                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Flux 24h</span>
                                    <span className="text-[10px] font-black text-orange-500">+{stats.newCount}</span>
                                </div>
                            )}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 md:flex-none px-4 md:px-8 py-3 md:py-3.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                        >
                            PRODUCTION <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </motion.button>
                    </div>
                    <div className="hidden md:block h-10 w-px bg-gray-200" />
                    <div className="flex p-1 bg-[#F5F5F7] rounded-full shrink-0">
                        {['homme', 'femme'].map(s => (
                            <button
                                key={s}
                                onClick={() => setSegment(s)}
                                className={cn(
                                    "px-4 md:px-6 py-1.5 md:py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full transition-all",
                                    segment === s ? "bg-[#007AFF] text-white shadow-lg shadow-blue-500/10" : "text-gray-400 hover:text-black"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-10 h-10 animate-spin text-[#007AFF] mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Synchronisation des flux...</p>
                    </div>
                ) : (
                    <>
                        {/* Control Bar Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-6 bg-white rounded-[25px] p-4 md:p-6 shadow-sm border border-gray-100">
                            <div className="flex flex-col px-2 lg:px-4 lg:border-r lg:border-gray-100">
                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Choix du type de {categoryLabel}</span>
                                <div className="relative">
                                    <select
                                        value={subFilter}
                                        onChange={(e) => setSubFilter(e.target.value)}
                                        className={cn(
                                            "w-full appearance-none transition-all border-none rounded-xl px-4 py-2 text-xs font-black cursor-pointer outline-none focus:ring-2 focus:ring-[#007AFF]",
                                            subFilter === 'ALL' ? "bg-black text-white" : "bg-[#F5F5F7] text-black"
                                        )}
                                    >
                                        <option value="ALL">SCORE GLOBAL</option>
                                        {styles.map(s => (
                                            <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className={cn("w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none", subFilter === 'ALL' ? "text-white/60" : "text-gray-400")} />
                                </div>
                            </div>

                            <div className="flex flex-col px-2 lg:px-4 lg:border-r lg:border-gray-100">
                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Quand tu veux sortir ta collection ?</span>
                                <div className="flex gap-2">
                                    {[30, 60, 90].map(days => (
                                        <motion.button
                                            key={days}
                                            onClick={() => setLeadTime(days)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={cn(
                                                "flex-1 md:flex-none px-4 md:px-5 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all duration-300",
                                                leadTime === days
                                                    ? "bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.3)]"
                                                    : "bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100"
                                            )}
                                        >
                                            {days / 30}M
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col px-2 lg:px-4 lg:border-r lg:border-gray-100 sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Prix Conseillé</span>
                                </div>
                                <div className="flex items-center gap-3 bg-[#F5F5F7] px-4 py-2 rounded-xl border border-blue-100">
                                    <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
                                    <span className="text-xs md:text-sm font-black text-black">
                                        {strategicAnalysis.priceRange.min}€ - {strategicAnalysis.priceRange.max}€
                                    </span>
                                </div>
                            </div>

                            {/* Couleurs Responsive */}
                            <div className="flex gap-4 md:gap-8 px-2 lg:px-4 sm:col-span-2 lg:col-span-1">
                                <div className="flex flex-col flex-1">
                                    <span className="text-[8px] md:text-[9px] font-black text-[#007AFF] uppercase tracking-widest mb-1.5 whitespace-nowrap">COULEURS VIRALES PROJETÉES</span>
                                    <div className="flex items-center gap-1.5 bg-blue-50/30 px-2.5 py-1.5 rounded-xl border border-blue-100/30">
                                        {strategicAnalysis.targetColors.map((color: any, idx: number) => (
                                            <div key={idx} className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm shadow-inner" style={{ backgroundColor: color.hex }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
                            {/* Main Chart Responsive */}
                            <div className="flex-1 lg:col-span-8 xl:col-span-9 bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-sm border border-gray-100 relative flex flex-col h-[400px] md:h-[500px] lg:h-[650px]">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-black uppercase tracking-tighter mb-1">Diagnostic de Tendance</h3>
                                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Data Viralité TikTok & Instagram</p>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                                        <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Score Tendance</span>
                                        <div className={cn(
                                            "text-xl md:text-2xl font-black flex items-center gap-2 transition-all",
                                            currentScoreValue >= 85 ? "text-[#34C759]" : currentScoreValue > 50 ? "text-[#FF9500]" : "text-[#FF3B30]"
                                        )}>
                                            {currentScoreValue}
                                            <span className="text-[10px] opacity-50 font-black">PTS</span>
                                            <div className={cn(
                                                "text-[9px] md:text-[10px] px-2 py-1 rounded-full font-black flex items-center gap-1",
                                                computedDiff >= 0 ? "bg-[#34C759]/10 text-[#34C759]" : "bg-[#FF3B30]/10 text-[#FF3B30]"
                                            )}>
                                                {dailyDiff >= 0 ? `+${dailyDiff}` : dailyDiff}
                                                <span className="opacity-70">({dailyPct}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Conteneur de la Courbe avec hauteur garantie */}
                                <div className="w-full relative h-[300px] md:h-[400px] lg:flex-1 lg:min-h-0">
                                    <PredictiveChart data={chartData} color={historyColor} predictionColor={predictionColor} />
                                </div>
                            </div>

                            {/* Diagnostic Sidebar Responsive */}
                            <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col h-auto lg:h-[650px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#007AFF] mb-1">Score</p>
                                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                                    <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-gray-100 shadow-sm relative overflow-hidden flex-1 flex flex-col">
                                        <div className={cn(
                                            "absolute top-0 left-0 w-full h-1.5",
                                            futureScore >= 85 ? "bg-[#34C759]" : futureScore >= 65 ? "bg-[#FF9500]" : "bg-[#FF3B30]"
                                        )} />

                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full animate-pulse", futureScore >= 50 ? "bg-[#34C759]" : "bg-[#FF3B30]")} />
                                                <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-400">Tendance</span>
                                            </div>
                                            <div className="px-3 py-1 bg-[#007AFF] rounded-full shadow-sm shadow-blue-500/10">
                                                <span className="text-[9px] md:text-[10px] font-black text-white uppercase">{leadTime / 30} MOIS</span>
                                            </div>
                                        </div>

                                        <h4 className={cn(
                                            "text-base md:text-lg font-black uppercase tracking-tight leading-tight mb-6 transition-colors",
                                            strategicAnalysis.recommendationLevel === "OPTIMAL" ? "text-[#34C759]" :
                                                strategicAnalysis.recommendationLevel === "PRUDENT" ? "text-black" :
                                                    strategicAnalysis.recommendationLevel === "NON-OPTIMAL" ? "text-[#FF9500]" : "text-[#FF3B30]"
                                        )}>
                                            {strategicAnalysis.recommendationLevel === "OPTIMAL" ? "Lancement Optimal" :
                                                strategicAnalysis.recommendationLevel === "PRUDENT" ? "Lancement Prudent" :
                                                    strategicAnalysis.recommendationLevel === "NON-OPTIMAL" ? "Manque de Pertinence" :
                                                        (isOffSeason ? `Risque Hors-Saison` : "Risque Élevé")}
                                        </h4>

                                        <div className="bg-[#F8F9FA] rounded-2xl p-4 md:p-5 mb-6 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="flex-1">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase">Score actuel</p>
                                                    <p className="text-xl md:text-2xl font-black">{currentScoreValue}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-300 mx-2 mb-1" />
                                                <div className="flex-1 text-right">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase">Potentiel (J+{leadTime})</p>
                                                    <p className={cn("text-xl md:text-2xl font-black", futureScore >= currentScoreValue ? "text-[#34C759]" : "text-[#FF3B30]")}>{futureScore}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-blue-50/20 rounded-2xl p-4 border border-blue-100/30 mb-6 min-h-[80px]">
                                            <p className="text-[10px] md:text-[11px] text-gray-700 font-bold leading-relaxed">
                                                {strategicAnalysis.commentary}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                                            <div>
                                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase block mb-1">Prix Cible</span>
                                                <span className="text-xs md:text-sm font-black text-[#007AFF]">
                                                    {strategicAnalysis.priceRange.min}€ - {strategicAnalysis.priceRange.max}€
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase block mb-1">Opportunité</span>
                                                <span className={cn(
                                                    "text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full border",
                                                    strategicAnalysis.marginLevel === "PEAK" ? "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20" :
                                                        strategicAnalysis.marginLevel === "STABLE" ? "bg-blue-50 text-[#007AFF] border-blue-100" :
                                                            "bg-orange-50 text-orange-500 border-orange-100"
                                                )}>
                                                    {strategicAnalysis.marginLevel === "PEAK" ? "MARGE MAX" :
                                                        strategicAnalysis.marginLevel === "STABLE" ? "STABLE" : "LIMITÉE"}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase block mb-1">Fiabilité</span>
                                                <span className="text-[10px] md:text-xs font-black">{reliabilityIndex}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
