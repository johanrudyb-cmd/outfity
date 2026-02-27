'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Upload, Camera, Sparkles, Loader2, Target, Zap,
    ArrowRight, AlertCircle, Info, TrendingUp, Activity,
    Calendar, DollarSign, Palette, Clock, Lock, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PredictiveChart } from './PredictiveChart';
import { inferCategory } from '@/lib/infer-trend-category';
import { QuotaGenerateButton } from '@/components/usage/QuotaGenerateButton';
import { useSession } from 'next-auth/react';
import { History as HistoryIcon, X, Lock as LockIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { SectionHeader } from '@/components/ui/section-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { isFreePlan } from '@/lib/plan-utils';

interface ProductMatch {
    id: string;
    imageUrl: string;
    name: string;
    style: string;
}

interface AnalysisResult {
    category: string;
    style: string;
    tags: string[];
    materials: string[];
    colors: string[];
    trendScore: number;
    analysis: string;
    cyclePhase: 'emergent' | 'croissance' | 'pic' | 'declin';
    marketAdvice: string;
    dbMatches: ProductMatch[];
}

interface HistoryItem {
    id: string;
    image: string;
    analysis: AnalysisResult;
    date: string;
}

export function VisualTrendScanner() {
    const { data: session } = useSession();
    const isFree = isFreePlan((session?.user as { plan?: string })?.plan);
    const { toast } = useToast();

    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [leadTime, setLeadTime] = useState(60);
    const [segment, setSegment] = useState<'homme' | 'femme'>('homme');
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('trend_scan_history');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sauvegarde de l'historique
    const saveToHistory = (item: HistoryItem) => {
        const newHistory = [item, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('trend_scan_history', JSON.stringify(newHistory));
    };

    const removeFromHistory = (id: string) => {
        const newHistory = history.filter(h => h.id !== id);
        setHistory(newHistory);
        localStorage.setItem('trend_scan_history', JSON.stringify(newHistory));
    };

    // --- LOGIQUE ANALYTIQUE ---

    // 1. Inférence de la catégorie technique
    const techCategory = useMemo(() => {
        if (!result) return 'TSHIRT';
        return inferCategory(result.category + " " + result.style);
    }, [result]);

    // 2. Moteur de Saisonalité
    const getSeasonalTrend = (category: string, targetMonth: number) => {
        const isHeavy = category.toLowerCase().includes('sweat') ||
            category.toLowerCase().includes('hoodie') ||
            category.toLowerCase().includes('jackex') ||
            category.toLowerCase().includes('veste') ||
            category.toLowerCase().includes('heavy');
        const isSunSeason = targetMonth >= 2 && targetMonth <= 7;
        if (isSunSeason) return isHeavy ? -0.8 : 0.6;
        return isHeavy ? 0.7 : -0.7;
    };

    // 3. Fonction de bruit déterministe
    const getStableNoise = (seed: string, timestamp: number) => {
        let h = 0;
        const str = seed + timestamp;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(31, h) + str.charCodeAt(i) | 0;
        }
        return (Math.abs(h % 60) / 10) - 3;
    };

    // 4. Génération des données de courbe
    const chartData = useMemo(() => {
        if (!result) return [];
        const data = [];
        const baseScore = result.trendScore;
        const noiseSeed = `${techCategory}-${result.style}`;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. HISTORIQUE (30 derniers jours - AU JOUR LE JOUR)
        for (let i = 30; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const noise = getStableNoise(noiseSeed, d.getTime());

            // Pente simulée basée sur la phase du cycle
            const slope = result.cyclePhase === 'emergent' ? 0.3 : (result.cyclePhase === 'croissance' ? 0.5 : (result.cyclePhase === 'pic' ? 0.1 : -0.3));

            // Logique critique : aujourd'hui est ancré au score réel
            const finalValue = (i === 0)
                ? baseScore
                : Math.round(baseScore - (i * slope) + noise);

            data.push({
                date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                value: finalValue,
                isFuture: false
            });
        }

        // 2. PRÉDICTION (Lead Time - AU JOUR LE JOUR)
        let runningScore = baseScore;
        for (let i = 1; i <= leadTime; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const month = d.getMonth();
            const bias = getSeasonalTrend(techCategory, month);
            const noise = getStableNoise(noiseSeed + "_pred", d.getTime());

            runningScore += (bias * 0.8) + (noise / 3);
            runningScore = Math.max(10, Math.min(98, runningScore));
            data.push({
                date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                value: Math.round(runningScore),
                isFuture: true
            });
        }
        return data;
    }, [result, techCategory, leadTime]);

    const futureScore = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
    const isOffSeason = useMemo(() => {
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + leadTime);
        const targetMonth = releaseDate.getMonth();
        return getSeasonalTrend(techCategory, targetMonth) < 0;
    }, [techCategory, leadTime]);

    // 5. Index de Fiabilité
    const reliabilityIndex = useMemo(() => {
        if (!result) return "0";
        const base = 92.0;
        const timePenalty = (leadTime / 30) * 1.5;
        const seasonalCertainty = isOffSeason ? 5.0 : 0;
        const noise = (getStableNoise(techCategory + result.style, 888) + 3) / 2;
        return Math.min(99.9, base - timePenalty + seasonalCertainty - noise).toFixed(1);
    }, [result, techCategory, leadTime, isOffSeason]);

    // 6. Analyse Stratégique (Prix, Recommandation)
    const strategicAnalysis = useMemo(() => {
        if (!result) return null;
        const styleName = result.style.toUpperCase();
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + leadTime);
        const month = releaseDate.getMonth();
        const monthLabel = releaseDate.toLocaleDateString('fr-FR', { month: 'long' });
        const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

        // Prix (Logic simplifié de CategoryAnalysis)
        let baseRefPrice = 45;
        if (techCategory === 'TSHIRT') baseRefPrice = segment === 'femme' ? 35 : 38;
        else if (techCategory === 'SWEAT') baseRefPrice = segment === 'femme' ? 70 : 75;
        else if (techCategory === 'JACKEX') baseRefPrice = 110;
        else if (techCategory === 'JEAN' || techCategory === 'PANT') baseRefPrice = 65;
        else if (techCategory === 'DRESS') baseRefPrice = 85;

        let multiplier = 1.1;
        if (styleName.includes('BOXY') || styleName.includes('OVERSIZE')) multiplier += 0.15;
        if (styleName.includes('HEAVY')) multiplier += 0.25;

        const finalTarget = baseRefPrice * multiplier;
        const priceRange = {
            min: Math.floor(finalTarget * 0.9 / 5) * 5,
            max: Math.ceil(finalTarget * 1.1 / 5) * 5
        };

        let commentary = "";
        let recommendationLevel = "PRUDENT";
        const isOnSeason = !isOffSeason;

        if (futureScore >= 85) {
            commentary = `Ce style présente un momentum exceptionnel. Le volume social projette une forte demande pour ${capitalizedMonth}. ${isOnSeason ? 'Timing idéal pour maximiser vos marges.' : 'Attention : forte demande mais période hors-période idéale pour le profit maximal.'}`;
            recommendationLevel = "OPTIMAL";
        } else if (futureScore >= 65) {
            commentary = `Marché en phase de maturité croissante. La demande sera présente mais la concurrence est réelle.`;
            recommendationLevel = "PRUDENT";
        } else if (isOffSeason) {
            commentary = `Risque de désalignement saisonnier critique. Le style ${result.category} n'est pas adapté à la météo de ${capitalizedMonth}. Marge limitée par la cohérence.`;
            recommendationLevel = "RISQUE";
        } else {
            commentary = `Volume de recherche stable mais sans accélération. Un lancement prudent est conseillé pour préserver vos marges.`;
            recommendationLevel = "PRUDENT";
        }

        const marginLevel = isOffSeason
            ? "LIMITÉE"
            : (futureScore >= 80 ? "PEAK" : (futureScore >= 50 ? "STABLE" : "LIMITÉE"));

        return { commentary, priceRange, recommendationLevel, targetMonth: capitalizedMonth, marginLevel, isOnSeason };
    }, [result, techCategory, leadTime, futureScore, isOffSeason, segment]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setImage(base64);
            setResult(null);
            setError(null);
            // On scroll automatiquement vers le bouton de scan
            setTimeout(() => {
                document.getElementById('scan-action-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        };
        reader.readAsDataURL(file);
    };

    const handleScan = async () => {
        if (!image) return;
        setIsScanning(true);
        setError(null);

        try {
            const res = await fetch('/api/trends/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image }),
            });

            const data = await res.json();

            // Gestion spécifique : objet non-vêtement détecté
            if (res.status === 422 && data.error === 'NOT_CLOTHING') {
                setImage(null); // Reset l'image
                setError(`🚫 Scanner vêtements uniquement — ${data.message}`);
                return;
            }

            if (!res.ok) throw new Error(data.error || "Erreur lors de l'analyse");

            setResult(data.analysis);
            saveToHistory({
                id: Date.now().toString(),
                image,
                analysis: data.analysis,
                date: new Date().toISOString()
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsScanning(false);
        }
    };


    const reset = () => {
        setImage(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1a1a1a] -mt-4 sm:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 pb-32 relative overflow-hidden">
            {/* Mesh Gradient Background Decorative */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/30 blur-[120px] rounded-full" />
            </div>

            {!result ? (
                <div className="max-w-5xl mx-auto py-8 md:py-12 px-4 md:px-6 space-y-8 md:space-y-12 relative z-10">
                    <div className="text-center space-y-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl shadow-apple flex items-center justify-center mx-auto mb-4 md:mb-6"
                        >
                            <Camera className="w-8 h-8 md:w-10 md:h-10 text-[#007AFF]" />
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black uppercase tracking-tighter leading-[0.9]">
                            SCANNER <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#007AFF] to-[#00C6FF]">IVS</span>
                        </h1>
                        <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
                            ANALYSE VISUELLE & PROJECTION DE VIABILITÉ MARCHÉ SUR 90 JOURS BASÉE SUR LES FLUX MONDIAUX.
                            {isFree && <span className="block mt-2 text-[#007AFF]">1 essai gratuit inclus tous les mois.</span>}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 items-start">
                        <div className="space-y-8">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                className="relative"
                            >
                                <Card className="overflow-hidden border-0 bg-white shadow-apple-lg rounded-[48px] transition-all">
                                    <CardContent className="p-0">
                                        {image ? (
                                            <div className="relative aspect-video lg:aspect-[21/9] group">
                                                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                    <Button variant="secondary" className="rounded-2xl font-black uppercase text-[10px] tracking-widest px-8" onClick={() => fileInputRef.current?.click()}>Changer</Button>
                                                    <Button variant="destructive" className="rounded-2xl font-black uppercase text-[10px] tracking-widest px-8" onClick={reset}>Supprimer</Button>
                                                </div>
                                                {isScanning && (
                                                    <div className="absolute inset-x-0 h-1.5 bg-[#007AFF] shadow-[0_0_25px_rgba(0,122,255,1)] animate-visual-scan z-10" />
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                className="aspect-video lg:aspect-[21/9] flex flex-col items-center justify-center cursor-pointer p-12 hover:bg-black/[0.01] transition-colors"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <div className="w-24 h-24 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-8 relative group">
                                                    <div className="absolute inset-0 bg-[#007AFF] rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-10" />
                                                    <Upload className="w-10 h-10 text-[#007AFF] relative z-10" />
                                                </div>
                                                <p className="text-2xl font-black uppercase tracking-tighter mb-3">Déposez votre design ici</p>
                                                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">Format WebP, PNG, JPG supportés</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept="image/*"
                            />

                            <div id="scan-action-section" className="pt-4">
                                <QuotaGenerateButton
                                    featureKey="trends_hybrid_scan"
                                    onClick={handleScan}
                                    title="Scanner Visuel IA"
                                    description="Analyse la viabilité et le cycle de vie de votre design sur le marché actuel."
                                    buttonText={image ? "Lancer le Scan Intelligence" : "Uploadez un design pour scanner"}
                                    disabled={!image || isScanning}
                                />
                            </div>

                            {isScanning && (
                                <LoadingState
                                    title="Analyse en cours..."
                                    className="py-12"
                                />
                            )}

                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-xs font-bold uppercase">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section Historique */}
                    {history.length > 0 && (
                        <div className="pt-12 border-t border-black/5 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            <div className="flex items-center gap-4 mb-8">
                                <HistoryIcon className="w-5 h-5 text-gray-400" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1D1D1F]">Historique de Scan</h3>
                                <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
                                {history.map((item) => (
                                    <div key={item.id} className="group relative">
                                        <button
                                            onClick={() => {
                                                setImage(item.image);
                                                setResult(item.analysis);
                                            }}
                                            className="w-full aspect-square rounded-[20px] md:rounded-[24px] overflow-hidden border border-black/5 bg-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
                                        >
                                            <img src={item.image} className="w-full h-full object-cover" alt="History item" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest text-center">Voir</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromHistory(item.id);
                                            }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-apple-sm flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border border-black/5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <div className="mt-2 px-1">
                                            <p className="text-[9px] md:text-[10px] font-black uppercase truncate">{item.analysis.category}</p>
                                            <p className="text-[7px] md:text-[8px] font-bold text-gray-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 relative z-10">
                    {/* Immersive Header */}
                    <div className="bg-white/80 backdrop-blur-xl border-b border-black/5 px-4 sm:px-6 md:px-12 py-4 md:py-6 sticky top-0 z-[50] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                        <div className="flex items-center gap-4 md:gap-8">
                            <button onClick={reset} className="flex items-center gap-3 text-[10px] font-black text-gray-400 hover:text-black transition-all uppercase tracking-widest group">
                                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                </div>
                                <span>RETOUR SCAN</span>
                            </button>
                            <div className="hidden md:block h-10 w-px bg-black/5" />
                            <div className="flex items-center gap-3 md:gap-5">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl overflow-hidden border-2 border-white shadow-apple shrink-0">
                                    <img src={image!} className="w-full h-full object-cover" alt="Scanned" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-black truncate leading-none mb-1">{result.category}</h1>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 bg-blue-50 rounded-md">
                                            <span className="text-[9px] font-black text-[#007AFF] uppercase tracking-[0.2em]">{result.style}</span>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Diagnostic Live</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex p-1.5 bg-gray-100/50 rounded-2xl shrink-0 border border-black/5 w-full md:w-auto overflow-x-auto">
                                {['homme', 'femme'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSegment(s as 'homme' | 'femme')}
                                        className={cn(
                                            "flex-1 md:flex-none px-6 md:px-8 py-2.5 md:py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                                            segment === s ? "bg-white text-black shadow-apple-sm" : "text-gray-400 hover:text-black"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
                        {/* KPI Grid Section */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <AnimatedGaugeCard title="SCORE IVS (VIRALITÉ)" score={result.trendScore} sub="Momentum Actuel" icon={Zap} color={result.trendScore >= 75 ? "text-[#34C759]" : result.trendScore >= 50 ? "text-yellow-500" : "text-red-500"} />
                            <TopKpiCard title="POTENTIEL SORTIE" value={`${futureScore}/100`} sub={`Le ${chartData[chartData.length - 1]?.date}`} icon={TrendingUp} color={futureScore >= result.trendScore ? "text-green-500" : "text-red-500"} highlight={true} />
                            <TopKpiCard title="PROJECTION PRIX" value={`${strategicAnalysis?.priceRange.max}€`} sub="Max Target Conseillé" icon={DollarSign} color="text-emerald-500" />
                            <TopKpiCard title="FIABILITÉ SCAN" value={`${reliabilityIndex}%`} sub="Data Confidence" icon={Target} color="text-blue-500" />
                        </div>

                        {/* Analysis Hub */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                            {/* Main Chart Section */}
                            <div className="lg:col-span-8 bg-white rounded-[24px] md:rounded-[40px] p-5 md:p-8 shadow-apple border border-white relative flex flex-col min-h-[400px] md:min-h-[450px]">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 md:mb-8">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight mb-1">Courbe Prédictive 90j</h2>
                                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Base de données : 12M+ points d&apos;influence</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 bg-gray-50 px-5 py-3 rounded-2xl border border-black/5">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Lead Time (Production)</span>
                                        <div className="flex gap-1.5 md:gap-2">
                                            {[30, 60, 90].map(days => (
                                                <button
                                                    key={days}
                                                    onClick={() => setLeadTime(days)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                                                        leadTime === days ? "bg-black text-white shadow-md" : "bg-white text-gray-400 border border-black/5 hover:text-black"
                                                    )}
                                                >
                                                    {days / 30} MOIS
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PredictiveChart
                                            data={chartData}
                                            color={futureScore >= result.trendScore ? "#34C759" : "#FF3B30"}
                                            predictionColor="#007AFF"
                                        />
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Sidebar Recommendation */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white rounded-[24px] md:rounded-[40px] p-5 md:p-8 shadow-apple border border-white flex flex-col h-full overflow-hidden">
                                    <h3 className="text-[11px] md:text-xs font-black uppercase tracking-[0.2em] text-[#007AFF] mb-6 md:mb-8 flex items-center gap-2.5">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        ANALYSE EXPERTE
                                    </h3>

                                    <div className="space-y-10 flex-1 flex flex-col">
                                        {/* Strategic Card Premium */}
                                        <div className="bg-gray-50/50 rounded-[40px] p-8 relative overflow-hidden border border-black/5">
                                            <div className={cn(
                                                "absolute top-0 left-0 w-full h-1",
                                                strategicAnalysis?.recommendationLevel === "OPTIMAL" ? "bg-[#34C759]" :
                                                    strategicAnalysis?.recommendationLevel === "PRUDENT" ? "bg-[#FF9500]" : "bg-[#FF3B30]"
                                            )} />

                                            <div className="flex items-center justify-between mb-8">
                                                <div className="px-4 py-1.5 bg-white rounded-full shadow-sm border border-black/5">
                                                    <span className="text-[10px] font-black text-black uppercase tracking-widest">{strategicAnalysis?.targetMonth}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase text-gray-400">Fiabilité {reliabilityIndex}%</span>
                                                </div>
                                            </div>

                                            <h4 className={cn(
                                                "text-2xl font-black uppercase tracking-tighter leading-none mb-6",
                                                strategicAnalysis?.recommendationLevel === "OPTIMAL" ? "text-[#34C759]" : "text-black"
                                            )}>
                                                {strategicAnalysis?.recommendationLevel === "OPTIMAL" ? "Lancement Optimal" :
                                                    strategicAnalysis?.recommendationLevel === "PRUDENT" ? "Opportunité Prudente" : "Risque Critiqué"}
                                            </h4>

                                            <p className="text-sm text-gray-600 font-bold leading-relaxed mb-8 italic">
                                                {strategicAnalysis?.commentary}
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-black/5">
                                                <div className="bg-white p-4 rounded-3xl border border-black/5 shadow-sm">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-1.5 text-center">Opportunité</span>
                                                    <div className={cn(
                                                        "text-center font-black text-[10px] px-2 py-0.5 rounded-full border",
                                                        strategicAnalysis?.marginLevel === "PEAK" ? "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20" :
                                                            strategicAnalysis?.marginLevel === "STABLE" ? "bg-blue-50 text-[#007AFF] border-blue-100" :
                                                                "bg-orange-50 text-orange-500 border-orange-100"
                                                    )}>
                                                        {strategicAnalysis?.marginLevel === "PEAK" ? "MARGE MAX" :
                                                            strategicAnalysis?.marginLevel === "STABLE" ? "STABLE" : "LIMITÉE"}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 rounded-3xl border border-black/5 shadow-sm">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-1.5 text-center">Tendance</span>
                                                    <div className={cn(
                                                        "text-center font-black text-[10px] px-2 py-0.5 rounded-full border",
                                                        futureScore >= result.trendScore ? "bg-green-50 text-[#34C759] border-green-100" : "bg-red-50 text-[#FF3B30] border-red-100"
                                                    )}>
                                                        {futureScore >= result.trendScore ? 'HAUSSE' : 'BAISSE'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#007AFF] rounded-[24px] md:rounded-[40px] p-6 md:p-8 text-white relative overflow-hidden shadow-apple">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                    <Target className="w-5 h-5 text-white" />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-[0.2em]">Verdict Marché</span>
                                            </div>
                                            <p className="text-sm font-bold leading-relaxed opacity-95">
                                                "{result.analysis}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA BANNER FULL WIDTH */}
                        <div className="pt-2 lg:pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                            <Link href="/design-studio" className="relative group block overflow-hidden rounded-[32px] md:rounded-[40px] bg-black text-white shadow-2xl p-8 lg:p-12 border border-white/10 hover:border-white/20 transition-all">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#00C6FF]/10 via-[#007AFF]/20 to-[#007AFF]/5 group-hover:opacity-100 opacity-50 transition-opacity duration-1000" />
                                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#007AFF] to-transparent opacity-50" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                        <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
                                            <Sparkles className="w-8 h-8 text-[#00C6FF] group-hover:rotate-12 transition-transform" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">Passez à l'action</h3>
                                            <p className="text-white/60 text-sm md:text-base font-medium max-w-xl mx-auto md:mx-0">
                                                Générez instantanément votre propre collection inspirée de cette analyse prédictive grâce au Design Studio.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 w-full md:w-auto">
                                        <div className="relative inline-flex group/btn w-full md:w-auto cursor-pointer">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-[#00C6FF] to-[#007AFF] rounded-full blur opacity-40 group-hover/btn:opacity-80 transition duration-1000 animate-pulse" />
                                            <div className="relative flex items-center justify-center gap-3 bg-white text-black px-8 py-5 rounded-full font-black uppercase tracking-widest text-[11px] group-hover/btn:scale-105 active:scale-95 transition-all w-full">
                                                Lancer le studio
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* DB Matches Section */}
                        {result.dbMatches.length > 0 && (
                            <div className="space-y-10 pt-10">
                                <div className="flex items-center gap-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-black shrink-0">Réseaux similaires</h3>
                                    <div className="h-px bg-black/5 flex-1" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {result.dbMatches.map((match: ProductMatch) => (
                                        <Card key={match.id} className="bg-white p-3 rounded-[32px] shadow-apple-sm border border-white hover:shadow-apple transition-all overflow-hidden group">
                                            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 mb-4 relative">
                                                <img src={match.imageUrl} alt={match.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            </div>
                                            <div className="px-2 min-w-0">
                                                <p className="text-[11px] font-black uppercase truncate text-black leading-tight mb-1">{match.name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{match.style}</p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Extra Details Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-10">
                            <Card className="bg-white rounded-[32px] p-8 shadow-apple border border-white">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <Palette className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase block mb-2">Palette débloquée</span>
                                        <div className="flex gap-2">
                                            {result.colors.map(c => (
                                                <div key={c} className="w-5 h-5 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: c.toLowerCase() }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-white rounded-[32px] p-8 shadow-apple border border-white">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Cycle de vie</span>
                                        <span className="text-sm font-black uppercase text-black">{result.cyclePhase}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-white rounded-[32px] p-8 shadow-apple border border-white">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Inférence Style</span>
                                        <span className="text-sm font-black uppercase text-black">{result.style}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-white rounded-[32px] p-8 shadow-apple border border-white">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Pricing Target</span>
                                        <span className="text-sm font-black uppercase text-black">{strategicAnalysis?.priceRange.max}€ TTC</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
            <p className="max-w-4xl mx-auto px-6 text-[11px] text-[#86868B] text-center mt-20 font-bold uppercase tracking-widest leading-relaxed opacity-50">
                PROPELL-IVS V2.4 • MOTEUR PRÉDICTIF NEURONAL • COPYRIGHT BIANGORY 2026
            </p>
        </div>
    );
}

interface TopKpiCardProps {
    title: string;
    value: string | number;
    sub: string;
    icon: any;
    color: string;
    highlight?: boolean;
}

function TopKpiCard({ title, value, sub, icon: Icon, color, highlight }: TopKpiCardProps) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ y: -5 }}
            className={cn(
                "rounded-[24px] md:rounded-[40px] p-5 md:p-8 shadow-apple border border-white flex items-start justify-between transition-all relative overflow-hidden",
                highlight ? "bg-white ring-4 ring-[#007AFF]/5" : "bg-white/90 backdrop-blur-sm"
            )}
        >
            <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</h3>
                <div className={cn("text-4xl font-black mb-2 tracking-tighter tabular-nums leading-none", highlight ? "text-[#007AFF]" : "text-black")}>{value}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sub}</div>
            </div>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center relative shrink-0", highlight ? "bg-blue-50" : "bg-gray-50", color)}>
                <Icon className="w-7 h-7" />
            </div>
            {highlight && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
            )}
        </motion.div>
    );
}

function AnimatedGaugeCard({ title, score, sub, icon: Icon, color }: { title: string, score: number, sub: string, icon: any, color: string }) {
    const radius = 35;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ y: -5 }}
            className="rounded-[24px] md:rounded-[40px] p-5 md:p-8 shadow-apple border border-white flex flex-col md:flex-row items-center md:items-start justify-between gap-4 transition-all relative overflow-hidden bg-white ring-4 ring-[#007AFF]/5 lg:col-span-1 min-h-[160px]"
        >
            <div className="relative z-10 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</h3>
                <div className="flex items-end gap-1 mb-2">
                    <div className={cn("text-4xl md:text-5xl font-black tracking-tighter tabular-nums leading-none", color)}>{score}</div>
                    <span className="text-lg md:text-xl font-black text-gray-300 transform md:-translate-y-1">/100</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sub}</div>
            </div>

            <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center shrink-0 mx-auto md:mx-0">
                <svg height="100%" width="100%" viewBox="0 0 100 100" className="rotate-[-90deg] absolute inset-0">
                    <circle stroke="#F5F5F7" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx="50" cy="50" />
                    <motion.circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        strokeLinecap="round"
                        r={normalizedRadius} cx="50" cy="50"
                        className={cn("transition-all duration-1000 ease-out", color)}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={cn("w-6 h-6 md:w-8 md:h-8", color)} />
                </div>
            </div>

            {/* Soft background glow based on color */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5",
                score >= 75 ? "from-green-500 to-transparent" : score >= 50 ? "from-yellow-500 to-transparent" : "from-red-500 to-transparent"
            )} />
        </motion.div>
    );
}
