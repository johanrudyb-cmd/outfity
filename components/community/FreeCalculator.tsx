'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Euro,
    Package,
    TrendingUp,
    Target,
    ArrowRight,
    Smartphone,
    Info,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

const DROP_PRODUCT_TYPES = [
    { id: 'hoodie', label: 'Hoodie', key: 'hoodie' },
    { id: 'veste', label: 'Veste', key: 'veste' },
    { id: 'tshirt', label: 'T-shirt', key: 'tshirt' },
    { id: 'pantalon', label: 'Pantalon', key: 'pantalon' },
] as const;

const WEIGHT_OPTIONS_BY_PRODUCT: Record<string, { value: string; label: string }[]> = {
    tshirt: [
        { value: '180 g/m²', label: '180' }, { value: '200 g/m²', label: '200' },
        { value: '220 g/m²', label: '220' },
    ],
    hoodie: [
        { value: '350 g/m²', label: '350' }, { value: '400 g/m²', label: '400' },
        { value: '450 g/m²', label: '450' },
    ],
    veste: [
        { value: '250 g/m²', label: '250' }, { value: '300 g/m²', label: '300' },
        { value: '350 g/m²', label: '350' },
    ],
    pantalon: [
        { value: '300 g/m²', label: '300' }, { value: '350 g/m²', label: '350' },
        { value: '400 g/m²', label: '400' },
    ],
};

function getDropSuggestion(productKey: string, isLuxe: boolean): { cogs: number; suggestedPrice: number } {
    const defaults: Record<string, { cogs: number; suggestedPrice: number }> = {
        hoodie: isLuxe ? { cogs: 35, suggestedPrice: 120 } : { cogs: 18, suggestedPrice: 65 },
        veste: isLuxe ? { cogs: 70, suggestedPrice: 280 } : { cogs: 28, suggestedPrice: 95 },
        tshirt: isLuxe ? { cogs: 22, suggestedPrice: 85 } : { cogs: 10, suggestedPrice: 35 },
        pantalon: isLuxe ? { cogs: 40, suggestedPrice: 160 } : { cogs: 18, suggestedPrice: 65 },
    };
    return defaults[productKey] ?? defaults.tshirt;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="block text-[11px] font-black text-[#86868B] uppercase tracking-[0.1em]">{label}</label>
            {children}
            {hint && <p className="text-[10px] text-[#86868B] font-medium leading-tight">{hint}</p>}
        </div>
    );
}

function StatCard({ label, value, sub, colorClass }: { label: string; value: string; sub?: string; colorClass?: string }) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-black/[0.05] shadow-sm">
            <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest mb-2">{label}</p>
            <p className={cn("text-3xl font-black tracking-tight", colorClass || "text-[#1D1D1F]")}>{value}</p>
            {sub && <p className="text-[12px] text-[#86868B] font-semibold mt-1">{sub}</p>}
        </div>
    );
}

export function FreeCalculator() {
    const { toast } = useToast();

    const [sellingPrice, setSellingPrice] = useState('65');
    const [quantity, setQuantity] = useState('100');
    const [marketingCost, setMarketingCost] = useState('1000');
    const [productionCost, setProductionCost] = useState('20');

    const [productType, setProductType] = useState('hoodie');
    const [isLuxe, setIsLuxe] = useState(false);
    const [sellThroughRate, setSellThroughRate] = useState(80);

    const qtyNum = parseInt(quantity) || 0;
    const sellPriceNum = parseFloat(sellingPrice) || 0;
    const mktNum = parseFloat(marketingCost) || 0;
    const prodCostNum = parseFloat(productionCost) || 0;

    const totalInvestment = (prodCostNum * qtyNum) + mktNum;
    const soldUnits = Math.round(qtyNum * sellThroughRate / 100);
    const revenue = sellPriceNum * soldUnits;
    const netProfit = revenue - totalInvestment;
    const marginPct = sellPriceNum > 0 ? ((sellPriceNum - prodCostNum) / sellPriceNum * 100).toFixed(1) : '0';
    const breakEvenUnits = sellPriceNum > 0 ? Math.ceil(totalInvestment / sellPriceNum) : 0;

    const applyTemplate = (type: string, luxe: boolean) => {
        const sug = getDropSuggestion(type, luxe);
        setProductType(type);
        setIsLuxe(luxe);
        setProductionCost(String(sug.cogs));
        setSellingPrice(String(sug.suggestedPrice));
        toast({
            title: "Scénario appliqué",
            message: `Modèle ${luxe ? 'Luxe' : 'Standard'} pour ${type} chargé.`,
            type: 'info'
        });
    };

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">

            {/* Configuration Column */}
            <div className="lg:col-span-7 space-y-10">

                {/* Templates Selection */}
                <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#1D1D1F] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" /> Choisis ton univers
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {DROP_PRODUCT_TYPES.map(p => (
                            <button
                                key={p.id}
                                onClick={() => applyTemplate(p.key, isLuxe)}
                                className={cn(
                                    "px-4 py-3 rounded-2xl border-2 font-bold text-xs uppercase transition-all active:scale-95",
                                    productType === p.key
                                        ? "bg-[#1D1D1F] border-[#1D1D1F] text-white shadow-xl shadow-black/10"
                                        : "bg-white border-black/5 text-[#86868B] hover:border-black/10"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => applyTemplate(productType, false)}
                            className={cn(
                                "flex-1 py-3 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all",
                                !isLuxe ? "border-blue-500 bg-blue-50 text-blue-600" : "border-black/5 bg-white text-[#86868B]"
                            )}
                        >
                            Standard / Street
                        </button>
                        <button
                            onClick={() => applyTemplate(productType, true)}
                            className={cn(
                                "flex-1 py-3 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all",
                                isLuxe ? "border-amber-500 bg-amber-50 text-amber-600" : "border-black/5 bg-white text-[#86868B]"
                            )}
                        >
                            Luxe / Premium
                        </button>
                    </div>
                </div>

                {/* Financial Inputs */}
                <div className="bg-white rounded-[40px] p-8 sm:p-10 border border-black/[0.05] shadow-apple-lg space-y-10">
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <Field label="Prix de vente public" hint="Ce que le client paie sur ton site">
                                <span className="sr-only">Prix</span>
                            </Field>
                            <div className="text-4xl font-black text-[#007AFF] tabular-nums">{sellPriceNum} €</div>
                        </div>
                        <input
                            type="range" min={10} max={300} step={1}
                            value={sellingPrice} onChange={e => setSellingPrice(e.target.value)}
                            className="w-full h-2 rounded-full bg-[#F5F5F7] accent-[#007AFF] appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <Field label="Coût de production (COGS)" hint="Prix unitaire à l'usine">
                            <div className="relative">
                                <input
                                    type="number" value={productionCost} onChange={e => setProductionCost(e.target.value)}
                                    className="w-full h-14 bg-[#F5F5F7] border-none rounded-2xl px-6 font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-[#86868B]">€</span>
                            </div>
                        </Field>

                        <Field label="Quantité du drop" hint="Minimum de commande (MoQ)">
                            <div className="relative">
                                <input
                                    type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                                    className="w-full h-14 bg-[#F5F5F7] border-none rounded-2xl px-6 font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-[#86868B]">PCS</span>
                            </div>
                        </Field>
                    </div>

                    <Field label="Budget Marketing Global" hint="Ads, Shootings, Influenceurs">
                        <div className="relative">
                            <input
                                type="number" value={marketingCost} onChange={e => setMarketingCost(e.target.value)}
                                className="w-full h-14 bg-[#F5F5F7] border-none rounded-2xl px-6 font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-[#86868B]">€ TTC</span>
                        </div>
                    </Field>
                </div>

                <div className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 blur-[80px] -translate-y-1/2 translate-x-1/4" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                        <div className="space-y-2">
                            <h4 className="text-xl font-black">Besoin d&apos;un Tech Pack Pro ?</h4>
                            <p className="text-blue-100 font-medium">L&apos;IA de Virgil génère ton dossier technique en 1 clic.</p>
                        </div>
                        <Link href="/auth/choose-plan">
                            <Button className="bg-white text-blue-600 hover:bg-white/90 px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] h-auto shadow-xl">
                                Découvrir l&apos;IA
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#1D1D1F] rounded-[40px] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-20 blur-[100px]" />

                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Analyse de Rentabilité</h2>
                            <TrendIndicator value={netProfit} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Bénéfice Net</p>
                                <p className={cn("text-4xl font-black tracking-tighter", netProfit > 0 ? "text-blue-400" : "text-red-400")}>
                                    {Math.round(netProfit)} €
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Marge Brute</p>
                                <p className="text-4xl font-black tracking-tighter text-white">
                                    {marginPct}%
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-white/10">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                    <span className="text-white/40">Taux de vente estimé</span>
                                    <span>{sellThroughRate}%</span>
                                </div>
                                <input
                                    type="range" min={10} max={100} step={5}
                                    value={sellThroughRate} onChange={e => setSellThroughRate(Number(e.target.value))}
                                    className="w-full h-1.5 rounded-full bg-white/10 accent-blue-500 appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-blue-400" />
                                    <span className="text-xs font-black uppercase tracking-widest">Objectif Point Mort</span>
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed font-medium">
                                    Tu dois vendre <strong className="text-white">{breakEvenUnits} pièces</strong> sur les {qtyNum} pour rembourser ton investissement de {Math.round(totalInvestment)}€.
                                </p>
                            </div>
                        </div>

                        <Link href="/auth/choose-plan">
                            <Button className="w-full py-8 bg-blue-500 hover:bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs h-auto mt-4 group">
                                Lancer mon drop avec l&apos;IA
                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Small Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Chiffre d&apos;Affaire" value={`${Math.round(revenue)}€`} sub={`Sur ${soldUnits} ventes`} />
                    <StatCard label="Investissement" value={`${Math.round(totalInvestment)}€`} sub="Total engagé" />
                </div>

                <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-black/5 flex items-start gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl">
                        <Info className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1D1D1F]">Astuce de Pro</p>
                        <p className="text-[12px] text-[#86868B] font-medium leading-relaxed">
                            Une marque de streetwear rentable vise généralement une <strong className="text-[#1D1D1F]">marge brute &gt; 65%</strong> pour couvrir ses frais d&apos;acquisition.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrendIndicator({ value }: { value: number }) {
    const isPositive = value > 0;
    return (
        <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
            isPositive ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
        )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <Target className="w-3 h-3" />}
            {isPositive ? "Profitable" : "À Ajuster"}
        </div>
    );
}
