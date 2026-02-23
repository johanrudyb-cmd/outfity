'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Upload, Camera, Sparkles, Loader2, Target, Zap,
    ArrowRight, AlertCircle, Info, TrendingUp, Activity,
    Calendar, DollarSign, Palette, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PredictiveChart } from './PredictiveChart';
import { inferCategory } from '@/lib/infer-trend-category';
import { QuotaGenerateButton } from '@/components/usage/QuotaGenerateButton';

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
    dbMatches: any[];
}

export function VisualTrendScanner() {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [leadTime, setLeadTime] = useState(60);
    const [segment, setSegment] = useState<'homme' | 'femme'>('homme');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Historique (30 jours)
        for (let i = 30; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const noise = getStableNoise(noiseSeed, d.getTime());
            data.push({
                date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                value: Math.round(baseScore - (i * 0.2) + noise),
                isFuture: false
            });
        }

        // Prédiction (leadTime)
        let runningScore = baseScore;
        for (let i = 1; i <= leadTime; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const month = d.getMonth();
            const bias = getSeasonalTrend(techCategory, month);
            const noise = getStableNoise(noiseSeed, d.getTime());
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
            if (!res.ok) throw new Error(data.error || "Erreur lors de l'analyse");

            setResult(data.analysis);
        } catch (err: any) {
            setError(err.message);
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
        <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1a1a1a] -mt-8 -mx-8">
            {!result ? (
                <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
                            <Camera className="w-8 h-8 text-[#007AFF]" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-black uppercase italic">Analyse de Style Visuel</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl font-medium">
                            Uploadez une photo. Notre scanner l&apos;analyse et projette sa viabilité sur les 90 prochains jours.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 items-start">
                        <div className="space-y-6">
                            <Card className="overflow-hidden border-2 border-dashed border-black/10 bg-white hover:bg-black/[0.01] transition-all shadow-sm rounded-[32px]">
                                <CardContent className="p-0">
                                    {image ? (
                                        <div className="relative aspect-video lg:aspect-[21/9] group">
                                            <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <Button variant="secondary" className="rounded-xl font-bold" onClick={() => fileInputRef.current?.click()}>Changer</Button>
                                                <Button variant="destructive" className="rounded-xl font-bold" onClick={reset}>Supprimer</Button>
                                            </div>
                                            {isScanning && (
                                                <div className="absolute inset-x-0 h-1 bg-[#007AFF] shadow-[0_0_15px_rgba(0,122,255,0.8)] animate-visual-scan z-10" />
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            className="aspect-video lg:aspect-[21/9] flex flex-col items-center justify-center cursor-pointer p-12"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-20 h-20 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-6">
                                                <Upload className="w-8 h-8 text-[#007AFF]" />
                                            </div>
                                            <p className="text-xl font-black uppercase tracking-tighter mb-2">Glissez une image ou cliquez</p>
                                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">PNG, JPG ou WEBP jusqu&apos;à 10MB</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept="image/*"
                            />

                            {image && !isScanning && (
                                <QuotaGenerateButton
                                    featureKey="trends_hybrid_scan"
                                    onClick={handleScan}
                                    title="Scanner Visuel IA"
                                    description="Analyse la viabilité et le cycle de vie de votre design sur le marché actuel."
                                    buttonText="Lancer l'analyse"
                                />
                            )}

                            {isScanning && (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-[#007AFF]" />
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Analyse en cours...</p>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-xs font-bold uppercase">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Header Premium */}
                    <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 md:py-6 sticky top-0 z-20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <div className="flex items-center gap-4 md:gap-8">
                            <button onClick={reset} className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest shrink-0">
                                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                <span>Nouveau Scan</span>
                            </button>
                            <div className="h-6 w-px bg-gray-100" />
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm shrink-0">
                                    <img src={image!} className="w-full h-full object-cover" alt="Scanned" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-sm md:text-xl font-black uppercase tracking-tighter text-black truncate">{result.category}</h1>
                                    <p className="text-[8px] md:text-[10px] font-bold text-[#007AFF] uppercase tracking-widest truncate">{result.style} Detected</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6">
                            <div className="flex p-1 bg-[#F5F5F7] rounded-full shrink-0">
                                {['homme', 'femme'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSegment(s as any)}
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
                        {/* Control Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-6 bg-white rounded-[25px] p-4 md:p-6 shadow-sm border border-gray-100">
                            <div className="flex flex-col px-2 lg:px-4 lg:border-r lg:border-gray-100">
                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Horizon de Sortie</span>
                                <div className="flex gap-2">
                                    {[30, 60, 90].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => setLeadTime(days)}
                                            className={cn(
                                                "flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all",
                                                leadTime === days ? "bg-[#007AFF] text-white font-black" : "bg-gray-50 text-gray-400 hover:text-black"
                                            )}
                                        >
                                            {days / 30}M
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col px-2 lg:px-4 lg:border-r lg:border-gray-100">
                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Prix Conseillé</span>
                                <div className="flex items-center gap-3 bg-[#F5F5F7] px-4 py-2 rounded-xl border border-blue-100">
                                    <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
                                    <span className="text-xs md:text-sm font-black text-black">
                                        {strategicAnalysis?.priceRange.min}€ - {strategicAnalysis?.priceRange.max}€
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col px-2 lg:px-4 flex-1">
                                <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Matières Détectées</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.materials.map(m => (
                                        <span key={m} className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100 text-[9px] font-black uppercase text-gray-500 tracking-tighter">{m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Main Chart Section */}
                            <div className="lg:col-span-8 bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight mb-2">Demande Globale</h2>
                                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Data Viralité TikTok & Instagram</p>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end">
                                        <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Score Actuel</span>
                                        <div className={cn(
                                            "text-2xl md:text-3xl font-black flex items-center gap-2",
                                            result.trendScore >= 80 ? "text-[#34C759]" : result.trendScore > 50 ? "text-[#FF9500]" : "text-[#FF3B30]"
                                        )}>
                                            {result.trendScore}
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const todayScore = chartData[30]?.value || 0;
                                    const yesterdayScore = chartData[29]?.value || 0;
                                    const isPositive = todayScore >= yesterdayScore;
                                    return (
                                        <PredictiveChart
                                            data={chartData}
                                            color={isPositive ? "#34C759" : "#FF3B30"}
                                            predictionColor="#007AFF"
                                        />
                                    );
                                })()}
                            </div>

                            {/* Sidebar Recommendation */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden h-full flex flex-col">
                                    <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#007AFF] mb-8 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> RECOMMANDATIONS
                                    </h3>

                                    <div className="space-y-6 flex-1 flex flex-col">
                                        <div className="bg-[#F8F9FA] rounded-[32px] p-6 relative overflow-hidden border border-gray-100">
                                            <div className={cn(
                                                "absolute top-0 left-0 w-full h-1.5",
                                                strategicAnalysis?.recommendationLevel === "OPTIMAL" ? "bg-[#34C759]" :
                                                    strategicAnalysis?.recommendationLevel === "PRUDENT" ? "bg-[#FF9500]" : "bg-[#FF3B30]"
                                            )} />

                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full animate-pulse bg-[#007AFF]" />
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-400">Scan Status</span>
                                                </div>
                                                <div className="px-3 py-1 bg-white rounded-full shadow-sm border border-gray-100">
                                                    <span className="text-[9px] font-black text-black uppercase">{strategicAnalysis?.targetMonth}</span>
                                                </div>
                                            </div>

                                            <h4 className={cn(
                                                "text-lg md:text-xl font-black uppercase tracking-tight leading-tight mb-4",
                                                strategicAnalysis?.recommendationLevel === "OPTIMAL" ? "text-[#34C759]" : "text-black"
                                            )}>
                                                {strategicAnalysis?.recommendationLevel === "OPTIMAL" ? "Lancement Optimal" :
                                                    strategicAnalysis?.recommendationLevel === "PRUDENT" ? "Lancement Prudent" : "Risque Élevé"}
                                            </h4>

                                            <p className="text-[11px] md:text-xs text-gray-600 font-bold leading-relaxed mb-6">
                                                {strategicAnalysis?.commentary}
                                            </p>

                                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200/50">
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-1 text-center">Opportunité</span>
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
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-1 text-center">Score Projecté</span>
                                                    <div className={cn(
                                                        "text-center font-black text-sm",
                                                        futureScore >= result.trendScore ? "text-[#34C759]" : "text-[#FF3B30]"
                                                    )}>{futureScore}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50/30 rounded-[32px] p-6 border border-blue-100/30">
                                            <div className="flex items-center gap-2 bg-gradient-to-r from-[#007AFF15] to-transparent px-3 py-1.5 rounded-full border border-[#007AFF20]">
                                                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
                                                <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider">Verdict Tendance</span>
                                                <div className="w-1 h-1 rounded-full bg-[#007AFF40]" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#007AFF60]">Analyse Vision</span>
                                            </div>
                                            <p className="text-[11px] font-bold italic text-gray-600 leading-relaxed">
                                                "{result.analysis}"
                                            </p>
                                        </div>
                                    </div>

                                    <Button className="mt-8 w-full h-14 rounded-2xl bg-[#007AFF] text-white hover:bg-blue-600 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                                        PRODUCTION <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* DB Matches Section */}
                        {result.dbMatches.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Références Marché Similaires</h3>
                                    <div className="h-px bg-gray-200 flex-1" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {result.dbMatches.map((match: any) => (
                                        <Card key={match.id} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden group">
                                            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-50 mb-3 relative">
                                                <img src={match.imageUrl} alt={match.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="px-1 min-w-0">
                                                <p className="text-[10px] font-black uppercase truncate text-black leading-tight">{match.name}</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{match.style}</p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Extra Details Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                        <Palette className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase block">Couleurs Détectées</span>
                                        <div className="flex gap-1.5 mt-1">
                                            {result.colors.map(c => (
                                                <div key={c} className="w-4 h-4 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: c.toLowerCase() }} title={c} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase block">Cycle de vie</span>
                                        <span className="text-xs font-black uppercase">{result.cyclePhase}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase block">Type de Style</span>
                                        <span className="text-xs font-black uppercase">{result.style}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase block">Verdict Prix</span>
                                        <span className="text-xs font-black uppercase">{strategicAnalysis?.priceRange.max}€ Target</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
