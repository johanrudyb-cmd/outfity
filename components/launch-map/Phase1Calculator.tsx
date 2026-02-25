'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Euro,
  Package,
  FolderPlus,
  Save,
  ChevronDown,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  BarChart3,
  Layers,
  ArrowRight,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { BrandIdentity } from './LaunchMapStepper';
import { useToast } from '@/components/ui/toast';
import { ALL_FASHION_CUTS } from '@/lib/constants/fashion-cuts';

const COGS_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30'];

const DROP_PRODUCT_TYPES = [
  { id: 'hoodie', label: 'Hoodie', key: 'hoodie' },
  { id: 'veste', label: 'Veste', key: 'veste' },
  { id: 'tshirt', label: 'T-shirt', key: 'tshirt' },
  { id: 'pantalon', label: 'Pantalon', key: 'pantalon' },
] as const;

const WEIGHT_OPTIONS_BY_PRODUCT: Record<string, { value: string; label: string }[]> = {
  tshirt: [
    { value: '140 g/m²', label: '140' }, { value: '160 g/m²', label: '160' },
    { value: '180 g/m²', label: '180' }, { value: '200 g/m²', label: '200' },
    { value: '220 g/m²', label: '220' },
  ],
  hoodie: [
    { value: '250 g/m²', label: '250' }, { value: '280 g/m²', label: '280' },
    { value: '300 g/m²', label: '300' }, { value: '350 g/m²', label: '350' },
    { value: '400 g/m²', label: '400' },
  ],
  veste: [
    { value: '200 g/m²', label: '200' }, { value: '250 g/m²', label: '250' },
    { value: '300 g/m²', label: '300' }, { value: '350 g/m²', label: '350' },
  ],
  pantalon: [
    { value: '250 g/m²', label: '250' }, { value: '300 g/m²', label: '300' },
    { value: '350 g/m²', label: '350' }, { value: '400 g/m²', label: '400' },
  ],
};

const DEGRESSIVE_TIERS = [
  { minQty: 1, maxQty: 49, factor: 1 },
  { minQty: 50, maxQty: 99, factor: 0.96 },
  { minQty: 100, maxQty: 199, factor: 0.92 },
  { minQty: 200, maxQty: 299, factor: 0.88 },
  { minQty: 300, maxQty: 9999, factor: 0.85 },
];

function getDegressiveFactor(quantity: number): number {
  if (quantity <= 0) return 1;
  const tier = DEGRESSIVE_TIERS.find((t) => quantity >= t.minQty && quantity <= t.maxQty);
  return tier?.factor ?? 1;
}

function getDropSuggestion(
  productKey: string, styleLabel: string, weightLabel?: string
): { cogs: number; suggestedPrice: number } {
  const style = styleLabel.toLowerCase();
  const isLuxe = /luxe|premium|quiet/i.test(style);
  const defaults: Record<string, { cogs: number; price: number }> = {
    hoodie: isLuxe ? { cogs: 35, price: 140 } : { cogs: 18, price: 65 },
    veste: isLuxe ? { cogs: 80, price: 320 } : { cogs: 28, price: 95 },
    tshirt: isLuxe ? { cogs: 22, price: 90 } : { cogs: 10, price: 38 },
    pantalon: isLuxe ? { cogs: 45, price: 180 } : { cogs: 18, price: 65 },
  };
  const d = defaults[productKey] ?? defaults.tshirt;
  return { cogs: d.cogs, suggestedPrice: d.price };
}

// ─── UI COMPONENTS ─────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[#86868B] leading-tight">{hint}</p>}
    </div>
  );
}

function NumberInput({ value, onChange, placeholder, suffix }: {
  value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7] px-4 py-2.5 text-[14px] text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all font-semibold"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#86868B]">{suffix}</span>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, colorClass }: { label: string; value: string; sub?: string; colorClass?: string }) {
  return (
    <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-black/[0.03]">
      <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">{label}</p>
      <p className={cn("text-[22px] font-black mt-1", colorClass || "text-[#1D1D1F]")}>{value}</p>
      {sub && <p className="text-[11px] text-[#86868B] font-medium mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── MAIN CALCULATOR ───────────────────────────────────────────────────────

export function Phase1Calculator({ brandId, brand, initialData, onComplete }: any) {
  const { toast } = useToast();

  // ── States ──
  const [sellingPrice, setSellingPrice] = useState(String(initialData?.sellingPrice || ''));
  const [quantity, setQuantity] = useState(String(initialData?.quantity || ''));
  const [marketingCost, setMarketingCost] = useState(String(initialData?.marketingCost || ''));
  const [productionCost, setProductionCost] = useState(String(initialData?.productionCost || ''));
  const [useBreakdown, setUseBreakdown] = useState(false);

  // Breakdown states
  const [costMatiere, setCostMatiere] = useState('');
  const [costFabrication, setCostFabrication] = useState('');
  const [costAccessoires, setCostAccessoires] = useState('');
  const [costPackaging, setCostPackaging] = useState('');
  const [costTransport, setCostTransport] = useState('');

  const [sellThroughRate, setSellThroughRate] = useState(80);
  const [dropProduct, setDropProduct] = useState('tshirt');
  const [dropWeight, setDropWeight] = useState('180 g/m²');
  const [showSimulator, setShowSimulator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isCompleted, setIsCompleted] = useState(initialData?.completed || false);

  // ── Calculations ──
  const qtyNum = parseInt(quantity) || 0;
  const sellPriceNum = parseFloat(sellingPrice) || 0;
  const mktNum = parseFloat(marketingCost) || 0;

  // COGS Calculation
  const breakdownSum = (parseFloat(costMatiere) || 0) + (parseFloat(costFabrication) || 0) + (parseFloat(costAccessoires) || 0) + (parseFloat(costPackaging) || 0) + (parseFloat(costTransport) || 0);
  const baseCogs = useBreakdown ? breakdownSum : (parseFloat(productionCost) || 0);
  const degressiveFactor = getDegressiveFactor(qtyNum);
  const effectiveCogs = baseCogs * degressiveFactor;

  // Global Financials
  const totalStockInvestment = effectiveCogs * qtyNum;
  const soldUnits = Math.round(qtyNum * sellThroughRate / 100);
  const unsoldUnits = qtyNum - soldUnits;
  const realRevenue = sellPriceNum * soldUnits;
  const realGrossProfit = realRevenue - totalStockInvestment; // Stock payé upfront
  const realNetProfit = realGrossProfit - mktNum;

  const unitGrossMargin = sellPriceNum - effectiveCogs;
  const grossMarginPct = sellPriceNum > 0 ? (unitGrossMargin / sellPriceNum * 100).toFixed(1) : '0';
  const netMarginPct = realRevenue > 0 ? (realNetProfit / realRevenue * 100).toFixed(1) : '0';

  const breakEvenUnits = sellPriceNum > 0 ? Math.ceil((totalStockInvestment + mktNum) / sellPriceNum) : 0;
  const breakEvenPct = qtyNum > 0 ? (breakEvenUnits / qtyNum * 100).toFixed(0) : '0';

  const isViable = realNetProfit > 0 && parseFloat(netMarginPct) >= 15;
  const riskColor = parseFloat(grossMarginPct) >= 65 ? 'text-[#34C759]' : parseFloat(grossMarginPct) >= 50 ? 'text-[#FF9500]' : 'text-[#FF3B30]';

  // COGS Chart Data
  const cogsData = [
    { name: 'Matière', value: parseFloat(costMatiere) || 0 },
    { name: 'Fab', value: parseFloat(costFabrication) || 0 },
    { name: 'Acc', value: parseFloat(costAccessoires) || 0 },
    { name: 'Pack', value: parseFloat(costPackaging) || 0 },
    { name: 'Transp', value: parseFloat(costTransport) || 0 },
  ].filter(d => d.value > 0);

  // ── Auto-Save Effect ──
  useEffect(() => {
    if (sellPriceNum <= 0 || qtyNum <= 0) return;
    const timeoutId = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const res = await fetch('/api/launch-map/phase1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            data: {
              sellingPrice: sellPriceNum, productionCost: baseCogs, marketingCost: mktNum,
              quantity: qtyNum, productType: dropProduct, weight: dropWeight, completed: true
            }
          })
        });
        if (res.ok) {
          setIsCompleted(true);
          setLastSaved(new Date());
        }
      } finally { setIsAutoSaving(false); }
    }, 1500); // 1.5s debounce
    return () => clearTimeout(timeoutId);
  }, [sellPriceNum, baseCogs, mktNum, qtyNum, dropProduct, dropWeight, brandId]);

  // ── Actions ──
  const applyScenario = () => {
    const sug = getDropSuggestion(dropProduct, 'Standard');
    setProductionCost(String(sug.cogs));
    setSellingPrice(String(sug.suggestedPrice));
    setQuantity('100');
    setShowSimulator(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/launch-map/phase1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          data: {
            sellingPrice: sellPriceNum, productionCost: baseCogs, marketingCost: mktNum,
            quantity: qtyNum, productType: dropProduct, weight: dropWeight, completed: true
          }
        })
      });
      if (res.ok) {
        setIsCompleted(true);
        toast({ title: 'Succès', message: 'Calculateur mis à jour.', type: 'success' });
      }
    } finally { setIsSaving(false); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

      {/* ── COLONNE GAUCHE (7/12) : CONFIGURATION ── */}
      <div className="xl:col-span-7 space-y-6">

        {/* SECTION 1 : SIMULATEUR */}
        <div className="bg-white rounded-[32px] border border-black/[0.06] shadow-apple overflow-hidden">
          <div className="px-8 py-5 border-b border-black/5 flex items-center justify-between bg-[#F5F5F7]/30">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-[#007AFF]" />
              <h2 className="text-[17px] font-bold text-[#1D1D1F]">Simulateur de Marché</h2>
            </div>
            <Button onClick={() => setShowSimulator(!showSimulator)} variant="ghost" className="text-[12px] font-bold text-[#007AFF]">
              {showSimulator ? 'Masquer' : 'Charger un modèle'}
            </Button>
          </div>
          <div className="p-8">
            {!showSimulator ? (
              <p className="text-[13px] text-[#86868B]">Besoin d'aide ? Utilisez nos estimations basées sur les coûts moyens de production Textile.</p>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Produit">
                    <select value={dropProduct} onChange={e => setDropProduct(e.target.value)} className="w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7] px-4 py-2.5 text-[14px] font-semibold">
                      {DROP_PRODUCT_TYPES.map(p => <option key={p.id} value={p.key}>{p.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Grammage / Matière">
                    <select value={dropWeight} onChange={e => setDropWeight(e.target.value)} className="w-full rounded-xl border border-black/[0.1] bg-[#F5F5F7] px-4 py-2.5 text-[14px] font-semibold">
                      {WEIGHT_OPTIONS_BY_PRODUCT[dropProduct]?.map(w => <option key={w.value} value={w.value}>{w.label} g/m²</option>)}
                    </select>
                  </Field>
                </div>
                <Button onClick={applyScenario} className="w-full rounded-full py-6 bg-[#1D1D1F] text-white font-bold hover:bg-[#1D1D1F]/90">
                  <Sparkles className="w-4 h-4 mr-2" /> Appliquer les standards du marché
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2 : PARAMÈTRES FINANCIERS */}
        <div className="bg-white rounded-[32px] border border-black/[0.06] shadow-apple overflow-hidden">
          <div className="px-8 py-5 border-b border-black/5 flex items-center gap-3 bg-[#F5F5F7]/30">
            <Euro className="w-5 h-5 text-[#007AFF]" />
            <h2 className="text-[17px] font-bold text-[#1D1D1F]">Paramètres du Drop</h2>
          </div>
          <div className="p-8 space-y-8">

            {/* Prix de vente slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Prix de vente public</label>
                  <p className="text-[10px] text-[#86868B] leading-tight">Ce que le client paie</p>
                </div>
                <span className="text-3xl font-black text-[#1D1D1F]">{sellPriceNum} €</span>
              </div>
              <input type="range" min={10} max={400} step={1} value={sellPriceNum || 50} onChange={e => setSellingPrice(e.target.value)} className="w-full h-2 rounded-full bg-[#F5F5F7] accent-[#007AFF] appearance-none cursor-pointer" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Field label="Volume total (MoQ)" hint="Nombre de pièces à produire">
                <NumberInput value={quantity} onChange={setQuantity} placeholder="100" suffix="pcs" />
              </Field>
              <Field label="Budget Marketing" hint="Ads, shooting, influenceurs">
                <NumberInput value={marketingCost} onChange={setMarketingCost} placeholder="1500" suffix="€" />
              </Field>
            </div>

            {/* COGS Section */}
            <div className="bg-[#F5F5F7]/50 rounded-3xl p-6 border border-black/[0.03] space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Coût de revient (COGS)</label>
                <Button onClick={() => setUseBreakdown(!useBreakdown)} variant="ghost" className="text-[11px] font-bold text-[#007AFF] p-0 h-auto">
                  {useBreakdown ? 'Prix Fixe' : 'Détailler les coûts'}
                </Button>
              </div>

              {!useBreakdown ? (
                <div className="space-y-2">
                  <NumberInput value={productionCost} onChange={setProductionCost} placeholder="25" suffix="€" />
                  {qtyNum > 0 && degressiveFactor < 1 && (
                    <p className="text-[11px] text-[#34C759] font-bold">
                      Economie d'échelle : -{Math.round((1 - degressiveFactor) * 100)}% appliqué (Réel: {(baseCogs * degressiveFactor).toFixed(2)}€/pc)
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Matière"><NumberInput value={costMatiere} onChange={setCostMatiere} suffix="€" /></Field>
                  <Field label="Confection"><NumberInput value={costFabrication} onChange={setCostFabrication} suffix="€" /></Field>
                  <Field label="Accessoires"><NumberInput value={costAccessoires} onChange={setCostAccessoires} suffix="€" /></Field>
                  <Field label="Packaging"><NumberInput value={costPackaging} onChange={setCostPackaging} suffix="€" /></Field>
                  <Field label="Transport"><NumberInput value={costTransport} onChange={setCostTransport} suffix="€" /></Field>
                  <div className="bg-white rounded-xl p-3 border border-black/5 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-[#86868B]">TOTAL</p>
                    <p className="text-xl font-black text-[#1D1D1F]">{breakdownSum.toFixed(2)}€</p>
                  </div>
                </div>
              )}

              {useBreakdown && cogsData.length > 0 && (
                <div className="h-[150px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={cogsData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {cogsData.map((_, i) => <Cell key={i} fill={COGS_COLORS[i % COGS_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── COLONNE DROITE (5/12) : RÉSULTATS & ANALYSE ── */}
      <div className="xl:col-span-5 xl:sticky xl:top-8 space-y-6">

        <div className="bg-white rounded-[32px] border border-black/[0.08] shadow-2xl overflow-hidden">
          <div className="px-8 py-5 border-b border-black/5 bg-[#1D1D1F] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#007AFF]" />
              <h2 className="text-[17px] font-bold">Tableau d'Analyse</h2>
            </div>
            {/* Auto-save indicator */}
            <div className="flex items-center gap-2">
              {isAutoSaving ? (
                <span className="text-[11px] font-medium text-white/50 animate-pulse flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Sauvegarde...</span>
              ) : lastSaved ? (
                <span className="text-[11px] font-medium text-[#34C759] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Enregistré</span>
              ) : null}
            </div>
          </div>

          <div className="p-8 space-y-8">

            {/* Taux de vente Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-[11px] font-bold text-[#86868B] uppercase">Taux de vente réel</label>
                  <p className="text-[10px] text-[#86868B]">Estimation réaliste : 70-80%</p>
                </div>
                <span className={cn("text-3xl font-black", sellThroughRate >= 80 ? "text-[#34C759]" : "text-[#FF9500]")}>{sellThroughRate}%</span>
              </div>
              <input type="range" min={20} max={100} step={5} value={sellThroughRate} onChange={e => setSellThroughRate(Number(e.target.value))} className="w-full h-1.5 rounded-full bg-[#F5F5F7] accent-[#007AFF] appearance-none cursor-pointer" />
              <p className="text-[11px] font-medium text-[#1D1D1F] bg-[#F5F5F7] p-2 rounded-lg text-center">
                🛒 <strong>{soldUnits}</strong> vendus · 📦 <strong>{unsoldUnits}</strong> invendus (Coût dormant: {Math.round(unsoldUnits * effectiveCogs)}€)
              </p>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Marge Brute / pc" value={`${unitGrossMargin.toFixed(1)}€`} sub={`${grossMarginPct}% du prix`} colorClass={riskColor} />
              <StatCard label="Profit Net" value={`${Math.round(realNetProfit)}€`} sub={`${netMarginPct}% net`} colorClass={realNetProfit > 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'} />
              <StatCard label="Chiffre d'Affaire" value={`${Math.round(realRevenue)}€`} sub={`Sur ${soldUnits} ventes`} />
              <StatCard label="Investissement" value={`${Math.round(totalStockInvestment)}€`} sub="Achat stock MoQ" />
            </div>

            {/* Point Mort avec Jauge Dynamique */}
            <div className={cn("p-5 rounded-2xl border-l-4 space-y-4", breakEvenUnits <= soldUnits ? "bg-[#34C759]/5 border-[#34C759]" : "bg-[#FF3B30]/5 border-[#FF3B30]")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#1D1D1F]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D1D1F]">Objectif de Rentabilité</span>
                </div>
                {breakEvenUnits <= soldUnits && (
                  <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">Atteint</span>
                )}
              </div>

              <div className="relative pt-6 pb-2">
                {/* Jauge Background (Stock Total) */}
                <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                  {/* Remplissage actuel (Ventes) */}
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", breakEvenUnits <= soldUnits ? "bg-[#34C759]" : "bg-[#FF9500]")}
                    style={{ width: `${Math.min(100, (soldUnits / qtyNum) * 100)}%` }}
                  />
                </div>
                {/* Marqueur Point mort */}
                <div
                  className="absolute top-1 bottom-0 w-0.5 bg-red-500 z-10 transition-all duration-500"
                  style={{ left: `${Math.min(100, breakEvenUnits / qtyNum * 100)}%` }}
                >
                  <div className="absolute -top-5 -left-8 text-[9px] font-bold text-red-500 whitespace-nowrap bg-[#F5F5F7] px-1 rounded">Point mort</div>
                </div>
              </div>

              <p className="text-[12px] text-[#1D1D1F] leading-snug">
                Vous devez vendre <strong>{breakEvenUnits} pièces</strong> ({breakEvenPct}% du stock) pour rembourser l'investissement total de <strong>{Math.round(totalStockInvestment + mktNum)}€</strong>.
              </p>
            </div>

            {/* Tableau de Scénarios Complet */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Simulations de Drop</label>
              <div className="space-y-2">
                {[60, 70, 80, 90, 100].map(rate => {
                  const sSold = Math.round(qtyNum * rate / 100);
                  const sRev = sellPriceNum * sSold;
                  const sNet = sRev - totalStockInvestment - mktNum;
                  const isCur = rate === sellThroughRate;
                  return (
                    <button key={rate} onClick={() => setSellThroughRate(rate)} className={cn("w-full flex items-center justify-between p-3 rounded-xl border transition-all", isCur ? "bg-[#007AFF]/5 border-[#007AFF]" : "bg-white border-black/5 hover:border-black/20")}>
                      <div className="text-left">
                        <span className="text-[13px] font-bold text-[#1D1D1F]">{rate}% vendu</span>
                        <p className="text-[10px] text-[#86868B]">{sSold} commandes</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-[13px] font-black", sNet > 0 ? "text-[#34C759]" : "text-[#FF3B30]")}>{Math.round(sNet)}€</p>
                        <p className="text-[10px] text-[#86868B]">Bénéfice Net</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Verdict & Save */}
            <div className="pt-6 border-t border-black/5 space-y-4">
              <div className={cn("flex items-center gap-3 p-4 rounded-2xl", isViable ? "bg-[#34C759]/5" : "bg-[#FF3B30]/5")}>
                {isViable ? <CheckCircle2 className="w-5 h-5 text-[#34C759]" /> : <AlertTriangle className="w-5 h-5 text-[#FF3B30]" />}
                <p className="text-[13px] font-bold text-[#1D1D1F]">
                  {isViable ? "Viabilité confirmée pour ce drop." : "Ajustez vos prix ou volumes."}
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || sellPriceNum <= 0}
                  className="w-full h-14 rounded-full bg-[#007AFF] text-white font-black text-[15px] hover:bg-[#007AFF]/90 shadow-lg shadow-[#007AFF]/20"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  {isCompleted ? 'Mettre à jour le budget' : 'Valider ce Business Model'}
                </Button>

                {/* CTA Viral sur Tiktok */}
                <Button
                  onClick={() => toast({ title: 'Redirection', message: 'Ouverture de Viral sur TikTok...' })}
                  className="w-full h-14 rounded-full bg-black text-white font-black text-[15px] hover:bg-black/90 shadow-lg relative overflow-hidden group border border-white/10"
                >
                  {/* Effet TikTok au hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#25F4EE]/20 via-transparent to-[#FE2C55]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#25F4EE]" />
                    Consulter et valider le drop avec <strong className="text-white ml-1">Viral sur Tiktok</strong>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FE2C55] animate-pulse absolute -right-4 top-1" />
                  </span>
                </Button>
              </div>
              <p className="text-[10px] text-[#86868B] text-center mt-6 font-medium leading-relaxed">
                Vérifiez les taux d'imposition selon votre statut. <br />
                Les prix affichés sont des moyennes du marché à titre indicatif.
              </p>
            </div>
          </div>
        </div>

        {isCompleted && (
          <Button onClick={() => toast({ title: 'Info', message: 'Fonction de sauvegarde de fichier en cours...' })} variant="outline" className="w-full h-12 rounded-full border-black/10 text-[13px] font-bold">
            <FolderPlus className="w-4 h-4 mr-2" />
            Exporter vers un fichier produit
          </Button>
        )}
      </div>
    </div>
  );
}
