'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  User,
  FileText,
  Euro,
  Package,
  FolderPlus,
  Save,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { BrandIdentity } from './LaunchMapStepper';
import { useToast } from '@/components/ui/toast';
import { ALL_FASHION_CUTS } from '@/lib/constants/fashion-cuts';

const ACCENT = '#8B5CF6';
const COGS_COLORS = [ACCENT, '#0EA5E9', '#10B981', '#F59E0B', '#EC4899'];

/** Types de produit pour le Simulateur de Drop (pas d’accessoire) */
const DROP_PRODUCT_TYPES = [
  { id: 'hoodie', label: 'Hoodie', key: 'hoodie' },
  { id: 'veste', label: 'Veste', key: 'veste' },
  { id: 'tshirt', label: 'T-shirt', key: 'tshirt' },
  { id: 'pantalon', label: 'Pantalon', key: 'pantalon' },
] as const;

const DROP_QUANTITIES = [50, 100, 200, 300] as const;

/** Coefficient selon grammage (plus lourd = COGS/prix plus élevés, cohérence marché) */
const WEIGHT_FACTOR: Record<string, number> = {
  '140 g/m²': 0.85,
  '160 g/m²': 0.95,
  '180 g/m²': 1,
  '200 g/m²': 1.1,
  '220 g/m²': 1.2,
  '250 g/m²': 0.95,
  '280 g/m²': 1,
  '300 g/m²': 1.08,
  '350 g/m²': 1.18,
  '400 g/m²': 1.3,
  '—': 1,
};
function getWeightFactor(weightLabel: string): number {
  return WEIGHT_FACTOR[weightLabel] ?? 1;
}

/** Grammages proposés par type de produit (alignés phase Design) */
const WEIGHT_OPTIONS_BY_PRODUCT: Record<string, { value: string; label: string }[]> = {
  tshirt: [
    { value: '140 g/m²', label: '140' },
    { value: '160 g/m²', label: '160' },
    { value: '180 g/m²', label: '180' },
    { value: '200 g/m²', label: '200' },
    { value: '220 g/m²', label: '220' },
  ],
  hoodie: [
    { value: '250 g/m²', label: '250' },
    { value: '280 g/m²', label: '280' },
    { value: '300 g/m²', label: '300' },
    { value: '350 g/m²', label: '350' },
    { value: '400 g/m²', label: '400' },
  ],
  veste: [
    { value: '200 g/m²', label: '200' },
    { value: '250 g/m²', label: '250' },
    { value: '300 g/m²', label: '300' },
    { value: '350 g/m²', label: '350' },
  ],
  pantalon: [
    { value: '250 g/m²', label: '250' },
    { value: '300 g/m²', label: '300' },
    { value: '350 g/m²', label: '350' },
    { value: '400 g/m²', label: '400' },
  ],
};

/** Suggestions COGS et prix par type de produit et grammage (moyennes marché). */
function getDropSuggestion(
  productKey: string,
  styleLabel: string,
  weightLabel?: string,
  signatureLabel?: string
): { cogs: number; suggestedPrice: number; label: string } {
  const style = styleLabel.toLowerCase();
  const signature = signatureLabel?.toLowerCase() || '';
  const isGorpcore = /gorpcore|techwear|outdoor|technique/i.test(style);
  const isLuxe = /luxe|premium|quiet/i.test(style);

  const defaults: Record<string, { cogs: number; price: number }> = {
    hoodie: isGorpcore ? { cogs: 22, price: 85 } : isLuxe ? { cogs: 35, price: 140 } : { cogs: 18, price: 65 },
    veste: isGorpcore ? { cogs: 45, price: 180 } : isLuxe ? { cogs: 80, price: 320 } : { cogs: 28, price: 95 },
    tshirt: isGorpcore ? { cogs: 12, price: 48 } : isLuxe ? { cogs: 22, price: 90 } : { cogs: 10, price: 38 },
    pantalon: isGorpcore ? { cogs: 25, price: 100 } : isLuxe ? { cogs: 45, price: 180 } : { cogs: 18, price: 65 },
  };
  const d = defaults[productKey] ?? defaults.tshirt;
  const factor = weightLabel ? getWeightFactor(weightLabel) : 1;

  // Ajustement par signature (Complexité/Volume)
  let signatureMultiplier = 1;
  if (signature.includes('oversize') || signature.includes('boxy') || signature.includes('wide')) signatureMultiplier = 1.15;
  if (signature.includes('premium')) signatureMultiplier = 1.25;
  if (signature.includes('cuir') || signature.includes('racing')) signatureMultiplier = 1.6;

  return {
    cogs: Math.round(d.cogs * factor * signatureMultiplier),
    suggestedPrice: Math.round(d.price * factor * signatureMultiplier),
    label: productKey,
  };
}

/** Grille dégressive : plus la quantité augmente, plus le coût unitaire baisse (taux appliqué au coût de base). */
const DEGRESSIVE_TIERS = [
  { minQty: 1, maxQty: 49, factor: 1, label: '1-49 pcs' },
  { minQty: 50, maxQty: 99, factor: 0.96, label: '50-99' },
  { minQty: 100, maxQty: 199, factor: 0.92, label: '100-199' },
  { minQty: 200, maxQty: 299, factor: 0.88, label: '200-299' },
  { minQty: 300, maxQty: 9999, factor: 0.85, label: '300+' },
] as const;

function getDegressiveFactor(quantity: number): number {
  if (quantity <= 0) return 1;
  const tier = DEGRESSIVE_TIERS.find((t) => quantity >= t.minQty && quantity <= t.maxQty);
  return tier?.factor ?? 1;
}

/** Extrait des fourchettes de prix mentionnées dans le texte stratégie (ex. "45-65 euros", "80-150€"). */
function extractPriceHints(strategyText: string): { min: number; max: number } | null {
  if (!strategyText?.trim()) return null;
  const matches = strategyText.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:€|euros?)/gi) ?? [];
  const ranges: { min: number; max: number }[] = [];
  matches.forEach((m) => {
    const parts = m.replace(/\s*(?:€|euros?)\s*/gi, '').split(/\s*[-–]\s*/);
    const a = parseInt(parts[0]?.replace(/\D/g, '') ?? '0', 10);
    const b = parseInt(parts[1]?.replace(/\D/g, '') ?? '0', 10);
    if (a > 0 && b > 0) ranges.push({ min: Math.min(a, b), max: Math.max(a, b) });
  });
  if (ranges.length === 0) return null;
  const min = Math.min(...ranges.map((r) => r.min));
  const max = Math.max(...ranges.map((r) => r.max));
  return { min, max };
}

interface Phase1CalculatorProps {
  brandId: string;
  brand?: BrandIdentity | null;
  initialData?: {
    sellingPrice?: number;
    productionCost?: number;
    marketingCost?: number;
    costMatiere?: number;
    costFabrication?: number;
    costAccessoires?: number;
    costPackaging?: number;
    costTransport?: number;
    quantity?: number;
    productType?: string;
    weight?: string;
    completed?: boolean;
  };
  onComplete?: () => void;
}

function styleGuideField(sg: Record<string, unknown> | null | undefined, key: string): string {
  if (!sg || typeof sg !== 'object') return '';
  const v = sg[key];
  return typeof v === 'string' ? v : '';
}

export function Phase1Calculator({ brandId, brand, initialData, onComplete }: Phase1CalculatorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const sg = brand?.styleGuide && typeof brand.styleGuide === 'object' ? (brand.styleGuide as Record<string, unknown>) : null;
  const [sellingPrice, setSellingPrice] = useState(String(initialData?.sellingPrice ?? ''));
  const [productionCost, setProductionCost] = useState(String(initialData?.productionCost ?? ''));
  const [marketingCost, setMarketingCost] = useState(String(initialData?.marketingCost ?? ''));
  const [costMatiere, setCostMatiere] = useState(String(initialData?.costMatiere ?? ''));
  const [costFabrication, setCostFabrication] = useState(String(initialData?.costFabrication ?? ''));
  const [costAccessoires, setCostAccessoires] = useState(String(initialData?.costAccessoires ?? ''));
  const [costPackaging, setCostPackaging] = useState(String(initialData?.costPackaging ?? ''));
  const [costTransport, setCostTransport] = useState(String(initialData?.costTransport ?? ''));
  const [quantity, setQuantity] = useState(String(initialData?.quantity ?? ''));
  const [coefficient, setCoefficient] = useState(2.8);
  const [useBreakdown, setUseBreakdown] = useState(
    Boolean(initialData?.costMatiere ?? initialData?.costFabrication ?? initialData?.costPackaging)
  );
  const [strategyContext, setStrategyContext] = useState<{
    templateBrandName: string;
    positioning: string | null;
    targetAudience: string | null;
    priceHint: { min: number; max: number } | null;
  } | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialData?.completed ?? false);
  const [dropProduct, setDropProduct] = useState<string>(initialData?.productType ?? 'tshirt');
  const [dropWeight, setDropWeight] = useState<string>(initialData?.weight ?? '180 g/m²');
  const [productSignature, setProductSignature] = useState(styleGuideField(sg, 'productSignature'));
  const [dropQty, setDropQty] = useState<number>(100);
  const hasPrefilledPriceFromStrategy = useRef(false);
  // Enregistrer dans un fichier (collection)
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [saveToFileOpen, setSaveToFileOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [articleLabel, setArticleLabel] = useState('');
  const [savingToFile, setSavingToFile] = useState(false);
  const [saveToFileDone, setSaveToFileDone] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    context: true,
    simulator: false,
    calculator: false,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!saveToFileOpen || !brandId) return;
    fetch(`/api/collections?brandId=${encodeURIComponent(brandId)}`)
      .then((res) => (res.ok ? res.json() : { collections: [] }))
      .then((data) => setCollections(data.collections ?? []))
      .catch(() => setCollections([]));
  }, [saveToFileOpen, brandId]);

  useEffect(() => {
    let cancelled = false;
    setStrategyLoading(true);
    fetch(`/api/brands/strategy/history?brandId=${encodeURIComponent(brandId)}`)
      .then((res) => (res.ok ? res.json() : { strategies: [] }))
      .then((data) => {
        if (cancelled) return;
        const list = data.strategies ?? [];
        const latest = list[0];
        if (latest) {
          const priceHint = extractPriceHints(latest.strategyText ?? '');
          setStrategyContext({
            templateBrandName: latest.templateBrandName ?? '',
            positioning: latest.positioning ?? null,
            targetAudience: latest.targetAudience ?? null,
            priceHint,
          });
        }
      })
      .catch(() => { if (!cancelled) setStrategyContext(null); })
      .finally(() => { if (!cancelled) setStrategyLoading(false); });
    return () => { cancelled = true; };
  }, [brandId]);

  // Pre-remplir le prix de vente depuis la stratégie (fourchette) une seule fois
  useEffect(() => {
    if (!strategyContext?.priceHint || hasPrefilledPriceFromStrategy.current) return;
    hasPrefilledPriceFromStrategy.current = true;
    const mid = Math.round((strategyContext.priceHint.min + strategyContext.priceHint.max) / 2);
    setSellingPrice(String(mid));
  }, [strategyContext?.priceHint]);

  const costMatiereNum = parseFloat(costMatiere) || 0;
  const costFabricationNum = parseFloat(costFabrication) || 0;
  const costAccessoiresNum = parseFloat(costAccessoires) || 0;
  const costPackagingNum = parseFloat(costPackaging) || 0;
  const costTransportNum = parseFloat(costTransport) || 0;
  const breakdownTotal =
    costMatiereNum + costFabricationNum + costAccessoiresNum + costPackagingNum + costTransportNum;
  const sellingPriceNum = parseFloat(sellingPrice) || 0;
  const productionCostNum =
    useBreakdown && breakdownTotal > 0 ? breakdownTotal : parseFloat(productionCost) || 0;
  const baseUnitCogs = productionCostNum; // coût unitaire de base (référence petite quantité)
  const marketingCostNum = parseFloat(marketingCost) || 0;
  const quantityNum = parseInt(quantity, 10) || 0;

  // Dégressif : plus on commande, plus le coût unitaire baisse
  const degressiveFactor = getDegressiveFactor(quantityNum);
  const effectiveUnitCogs = baseUnitCogs * degressiveFactor;
  const cogs = effectiveUnitCogs; // utilisé partout pour coût unitaire effectif

  const grossMargin = sellingPriceNum - effectiveUnitCogs;
  const grossMarginPercent =
    sellingPriceNum > 0 ? ((grossMargin / sellingPriceNum) * 100).toFixed(1) : '0';
  const grossMarginNum = parseFloat(grossMarginPercent) || 0;
  const totalProductionCost = effectiveUnitCogs * quantityNum;
  const totalGrossMargin = sellingPriceNum * quantityNum - totalProductionCost;
  const totalNetProfit = totalGrossMargin - marketingCostNum;
  const netMarginPercent =
    sellingPriceNum > 0 && quantityNum > 0
      ? ((totalNetProfit / (sellingPriceNum * quantityNum)) * 100).toFixed(1)
      : '0';
  const isViable = totalNetProfit > 0 && parseFloat(netMarginPercent) >= 20;
  const costPerUnit = effectiveUnitCogs;
  const marginPerUnit = quantityNum > 0 ? totalNetProfit / quantityNum : 0;
  const netMargin = quantityNum > 0 ? totalNetProfit / quantityNum : grossMargin - marketingCostNum;

  const marginPerPiece = sellingPriceNum - effectiveUnitCogs;
  const coefficientActual = effectiveUnitCogs > 0 ? sellingPriceNum / effectiveUnitCogs : 0;
  const totalRevenue = sellingPriceNum * quantityNum;

  // Point mort : couvrir marketing + stock investi (coût total production)
  const totalCostsToCover = marketingCostNum + totalProductionCost;
  const breakEvenPieces =
    sellingPriceNum > cogs && marginPerPiece > 0
      ? Math.ceil(totalCostsToCover / marginPerPiece)
      : 0;

  const riskLevel =
    grossMarginNum >= 65 ? 'green' : grossMarginNum >= 50 ? 'orange' : 'red';

  const cogsDonutData =
    breakdownTotal > 0
      ? [
        { name: 'Matière première', value: costMatiereNum },
        { name: 'CMT (main d\'œuvre)', value: costFabricationNum },
        { name: 'Accessoires', value: costAccessoiresNum },
        { name: 'Packaging', value: costPackagingNum },
        { name: 'Transport usine', value: costTransportNum },
      ].filter((d) => d.value > 0)
      : [];

  const handleSave = async () => {
    const productChanged = dropProduct !== (initialData?.productType ?? 'tshirt') || dropWeight !== (initialData?.weight ?? '180 g/m²');
    if (productChanged && !window.confirm('Vous avez modifié le produit principal ou le grammage par rapport au choix de la phase Identité. Confirmer l\'enregistrement ?')) {
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('/api/launch-map/phase1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          data: {
            sellingPrice: sellingPriceNum,
            productionCost: productionCostNum,
            marketingCost: marketingCostNum,
            costMatiere: useBreakdown ? costMatiereNum : undefined,
            costFabrication: useBreakdown ? costFabricationNum : undefined,
            costAccessoires: useBreakdown ? costAccessoiresNum : undefined,
            costPackaging: useBreakdown ? costPackagingNum : undefined,
            costTransport: useBreakdown ? costTransportNum : undefined,
            quantity: quantityNum || undefined,
            productType: dropProduct,
            weight: dropWeight,
            grossMargin,
            grossMarginPercent: parseFloat(grossMarginPercent),
            netMargin,
            netMarginPercent: parseFloat(netMarginPercent),
            isViable,
            completed: true,
          },
        }),
      });
      if (response.ok) {
        setIsCompleted(true);
        toast({
          title: 'Calcul enregistré !',
          message: 'Votre simulation de rentabilité a été mise à jour.',
          type: 'success',
        });
        router.refresh();
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        message: 'Impossible d\'enregistrer vos modifications.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToFile = async () => {
    const collectionId = newCollectionName.trim() ? null : selectedCollectionId;
    if (!collectionId && !newCollectionName.trim()) return;
    setSavingToFile(true);
    setSaveToFileDone(false);
    try {
      let targetCollectionId = collectionId;
      if (newCollectionName.trim()) {
        const createRes = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId, name: newCollectionName.trim() }),
        });
        if (!createRes.ok) throw new Error('Impossible de créer le fichier');
        const { collection } = await createRes.json();
        targetCollectionId = collection.id;
      }
      const payload = {
        sellingPrice: sellingPriceNum,
        productionCost: productionCostNum,
        marketingCost: marketingCostNum,
        quantity: quantityNum || undefined,
        productType: dropProduct,
        weight: dropWeight,
        grossMarginPercent: parseFloat(grossMarginPercent),
        netMarginPercent: parseFloat(netMarginPercent),
        isViable,
        costMatiere: useBreakdown ? costMatiereNum : undefined,
        costFabrication: useBreakdown ? costFabricationNum : undefined,
        costAccessoires: useBreakdown ? costAccessoiresNum : undefined,
        costPackaging: useBreakdown ? costPackagingNum : undefined,
        costTransport: useBreakdown ? costTransportNum : undefined,
      };
      const res = await fetch(`/api/collections/${targetCollectionId}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'calculator',
          label: articleLabel.trim() || undefined,
          payload,
        }),
      });
      if (!res.ok) throw new Error('Impossible d\'ajouter l\'article');
      setSaveToFileDone(true);
      toast({
        title: 'Article ajouté !',
        message: `Calcul ajouté au fichier "${newCollectionName.trim() || collections.find(c => c.id === targetCollectionId)?.name}".`,
        type: 'success',
      });
      setNewCollectionName('');
      setArticleLabel('');
      setSelectedCollectionId(collections[0]?.id ?? '');
    } catch (e) {
      console.error(e);
      window.alert('Erreur lors de l\'enregistrement dans le fichier.');
    } finally {
      setSavingToFile(false);
    }
  };

  const identityPositioning = styleGuideField(sg, 'preferredStyle') || styleGuideField(sg, 'positioning') || '';
  const identityTarget = styleGuideField(sg, 'targetAudience') || '';
  const identityProduct = styleGuideField(sg, 'mainProduct') || '';

  const applyCoefficient = (coef: number) => {
    setCoefficient(coef);
    const base = useBreakdown && breakdownTotal > 0 ? breakdownTotal : parseFloat(productionCost) || 0;
    if (base > 0) setSellingPrice(String(Math.round(base * coef)));
  };

  const styleForDrop = identityPositioning || strategyContext?.positioning || 'Streetwear';
  const weightOptions = WEIGHT_OPTIONS_BY_PRODUCT[dropProduct] ?? WEIGHT_OPTIONS_BY_PRODUCT.tshirt;
  const applyDropScenario = () => {
    const suggestion = getDropSuggestion(dropProduct, styleForDrop, dropWeight, productSignature);
    setQuantity(String(dropQty));
    if (!useBreakdown) {
      setProductionCost(String(suggestion.cogs));
    } else {
      setCostMatiere(String(Math.round(suggestion.cogs * 0.5)));
      setCostFabrication(String(Math.round(suggestion.cogs * 0.3)));
      setCostAccessoires(String(Math.round(suggestion.cogs * 0.08)));
      setCostPackaging(String(Math.round(suggestion.cogs * 0.07)));
      setCostTransport(String(Math.round(suggestion.cogs * 0.05)));
    }
    setSellingPrice(String(suggestion.suggestedPrice));
  };

  const marginVerdict =
    grossMarginNum >= 65 ? 'marge saine (luxe accessible)' : grossMarginNum >= 50 ? 'marge correcte' : 'marge faible';

  return (
    <div className="space-y-6">
      {/* 1. Contexte (identité + stratégie) */}
      <Card className="border-2 bg-muted/20 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('context')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30"
        >
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            1. Rappel Contexte
          </CardTitle>
          <ChevronDown className={cn("w-4 h-4 transition-transform", !collapsedSections.context && "rotate-180")} />
        </button>
        {!collapsedSections.context && (
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <User className="w-4 h-4 text-primary" />
                  Phase Identité
                </div>
                <dl className="space-y-1.5 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Marque :</span>{' '}
                    {brand?.name ?? '—'}
                  </div>
                  {identityPositioning && (
                    <div>
                      <span className="font-medium text-foreground">Positionnement :</span>{' '}
                      {identityPositioning}
                    </div>
                  )}
                  {identityTarget && (
                    <div>
                      <span className="font-medium text-foreground">Cible :</span> {identityTarget}
                    </div>
                  )}
                  {identityProduct && (
                    <div>
                      <span className="font-medium text-foreground">Produit principal :</span>{' '}
                      {identityProduct}
                    </div>
                  )}
                </dl>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Phase Stratégie
                </div>
                {strategyLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement…
                  </div>
                ) : strategyContext ? (
                  <dl className="space-y-1.5 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Marque d&apos;inspiration :</span>{' '}
                      {strategyContext.templateBrandName || '—'}
                    </div>
                    {strategyContext.positioning && (
                      <div>
                        <span className="font-medium text-foreground">Positionnement choisi :</span>{' '}
                        {strategyContext.positioning}
                      </div>
                    )}
                    {strategyContext.targetAudience && (
                      <div>
                        <span className="font-medium text-foreground">Cible :</span>{' '}
                        {strategyContext.targetAudience}
                      </div>
                    )}
                    {strategyContext.priceHint && (
                      <div className="pt-2 mt-2 border-t border-border">
                        <span className="font-medium text-foreground">Fourchettes issues de la stratégie :</span>{' '}
                        {strategyContext.priceHint.min}–{strategyContext.priceHint.max} €
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complétez la phase Stratégie pour voir la marque d&apos;inspiration et les fourchettes.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 2. Simulateur de Drop (pré-remplit coûts + quantité) */}
      <Card className="border-2 border-primary/10 bg-primary/5 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('simulator')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30"
        >
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            2. Simulateur de Drop
          </CardTitle>
          <ChevronDown className={cn("w-4 h-4 transition-transform", !collapsedSections.simulator && "rotate-180")} />
        </button>
        {!collapsedSections.simulator && (
          <CardContent className="pt-0 space-y-4">
            <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {identityPositioning || strategyContext?.templateBrandName ? (
                <>
                  Adapté à <strong className="text-foreground">{styleForDrop}</strong>
                  {strategyContext?.templateBrandName && (
                    <> et à <strong className="text-foreground">{strategyContext.templateBrandName}</strong></>
                  )}
                  . Choisissez un type de produit et une quantité : on pré-remplit les coûts moyens.
                </>
              ) : (
                'Choisissez un type de produit et une quantité pour pré-remplir les coûts.'
              )}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Produit principal</label>
                <select
                  value={dropProduct}
                  onChange={(e) => {
                    setDropProduct(e.target.value);
                    const opts = WEIGHT_OPTIONS_BY_PRODUCT[e.target.value] ?? WEIGHT_OPTIONS_BY_PRODUCT.tshirt;
                    setDropWeight(opts[0]?.value ?? '180 g/m²');
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DROP_PRODUCT_TYPES.map((p) => (
                    <option key={p.id} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Grammage (g/m²)</label>
                <select
                  value={dropWeight}
                  onChange={(e) => setDropWeight(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {weightOptions.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Quantité cible</label>
                <select
                  value={dropQty}
                  onChange={(e) => setDropQty(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DROP_QUANTITIES.map((q) => (
                    <option key={q} value={q}>{q} pièces</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Coupe / Signature</label>
                <select
                  value={productSignature}
                  onChange={(e) => setProductSignature(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Sélectionner</option>
                  {ALL_FASHION_CUTS.map((cut) => (
                    <option key={cut} value={cut}>{cut}</option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="default" size="sm" onClick={applyDropScenario} className="shrink-0">
                Appliquer ce scénario
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Coûts indicatifs selon &quot;{styleForDrop}&quot; et grammage : T-shirt ~{getDropSuggestion('tshirt', styleForDrop, dropWeight).cogs}€, Hoodie ~{getDropSuggestion('hoodie', styleForDrop, dropWeight).cogs}€, Veste ~{getDropSuggestion('veste', styleForDrop, dropWeight).cogs}€, Pantalon ~{getDropSuggestion('pantalon', styleForDrop, dropWeight).cogs}€.
            </p>
          </CardContent>
        )}
      </Card>

      {/* 3. Calculateur de rentabilité */}
      <Card className="border-2 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('calculator')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30"
        >
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Euro className="w-4 h-4 text-primary" />
            3. Calculateur de rentabilité
          </CardTitle>
          <ChevronDown className={cn("w-4 h-4 transition-transform", !collapsedSections.calculator && "rotate-180")} />
        </button>
        {!collapsedSections.calculator && (
          <CardContent className="pt-0 space-y-6">
            <div className="mt-2 text-xs text-muted-foreground">
              Prix de vente, coûts (COGS), quantité, marketing. Coefficient DTC 2,5–4, point mort, budget MoQ.
            </div>
            {strategyContext?.templateBrandName && (sellingPriceNum > 0 || cogs > 0) && (
              <p className="text-sm text-muted-foreground">
                Prix <strong className="text-foreground">{sellingPriceNum || '—'} €</strong> (inspiré de {strategyContext.templateBrandName}), coût <strong className="text-foreground">{cogs || '—'} €</strong> → {marginVerdict}.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Prix de vente visé (€)</label>
                <Input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder={strategyContext?.priceHint ? String(strategyContext.priceHint.min) : '80'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Quantité (pièces)</label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Frais marketing (€)</label>
                <Input type="number" value={marketingCost} onChange={(e) => setMarketingCost(e.target.value)} placeholder="15" />
              </div>
            </div>

            {/* COGS : global ou détaillé (5 postes + donut) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-foreground">Coût de revient (COGS)</label>
                <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setUseBreakdown(!useBreakdown)}>
                  {useBreakdown ? 'Un seul montant' : 'Détailler (matière, CMT, accessoires, packaging, transport)'}
                </Button>
              </div>
              {useBreakdown ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-lg border border-border bg-muted/20">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Matière (€)</label>
                      <Input type="number" value={costMatiere} onChange={(e) => setCostMatiere(e.target.value)} placeholder="12" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">CMT (€)</label>
                      <Input type="number" value={costFabrication} onChange={(e) => setCostFabrication(e.target.value)} placeholder="8" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Accessoires (€)</label>
                      <Input type="number" value={costAccessoires} onChange={(e) => setCostAccessoires(e.target.value)} placeholder="2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Packaging (€)</label>
                      <Input type="number" value={costPackaging} onChange={(e) => setCostPackaging(e.target.value)} placeholder="3" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Transport (€)</label>
                      <Input type="number" value={costTransport} onChange={(e) => setCostTransport(e.target.value)} placeholder="2" />
                    </div>
                  </div>
                  {breakdownTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      COGS de base (réf.) : <span className="font-semibold text-foreground">{breakdownTotal.toFixed(2)} €</span>/pièce
                      {quantityNum > 0 && degressiveFactor < 1 && (
                        <> · À {quantityNum} pcs (dégressif) : <span className="font-semibold text-foreground">{effectiveUnitCogs.toFixed(2)} €</span>/pièce</>
                      )}
                    </p>
                  )}
                  {cogsDonutData.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/10 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Répartition des coûts</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={cogsDonutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                            {cogsDonutData.map((_, i) => (
                              <Cell key={i} fill={COGS_COLORS[i % COGS_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Input type="number" value={productionCost} onChange={(e) => setProductionCost(e.target.value)} placeholder="25" />
                  {quantityNum > 0 && baseUnitCogs > 0 && degressiveFactor < 1 && (
                    <p className="text-xs text-muted-foreground">
                      Coût de base : {baseUnitCogs.toFixed(2)} €/pièce · À {quantityNum} pcs (dégressif) : <strong className="text-foreground">{effectiveUnitCogs.toFixed(2)} €</strong>/pièce
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Grille dégressive : coût unitaire selon la quantité */}
            {baseUnitCogs > 0 && (
              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Prix dégressif (plus vous commandez, moins le coût unitaire)</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {[50, 100, 200, 300].map((q) => {
                    const factor = getDegressiveFactor(q);
                    const unitCogs = baseUnitCogs * factor;
                    const isCurrentTier = quantityNum > 0 && getDegressiveFactor(quantityNum) === factor;
                    return (
                      <div key={q} className={isCurrentTier ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                        À {q} pcs : <span className="text-foreground">{unitCogs.toFixed(2)} €</span>/pièce
                        {factor < 1 && <span className="text-xs ml-1">(-{Math.round((1 - factor) * 100)} %)</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coefficient multiplicateur */}
            {cogs > 0 && (
              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coefficient (DTC 2,5–4)</p>
                <div className="flex flex-wrap items-center gap-4">
                  <input
                    type="range"
                    min={2.5}
                    max={4}
                    step={0.1}
                    value={cogs > 0 && sellingPriceNum > 0 ? Math.min(4, Math.max(2.5, sellingPriceNum / cogs)) : coefficient}
                    onChange={(e) => applyCoefficient(parseFloat(e.target.value))}
                    className="flex-1 min-w-[120px] accent-primary"
                  />
                  <span className="text-sm font-semibold text-foreground">×{(cogs > 0 && sellingPriceNum > 0 ? sellingPriceNum / cogs : coefficient).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">→ Prix : <strong className="text-foreground">{sellingPriceNum || Math.round(cogs * coefficient)} €</strong></span>
                </div>
              </div>
            )}

            {/* Point mort (marketing + stock investi) */}
            {sellingPriceNum > cogs && marginPerPiece > 0 && (
              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Point mort (break-even)</p>
                <p className="text-sm text-foreground">
                  Vendez <strong className="text-primary">{breakEvenPieces} pièce{breakEvenPieces > 1 ? 's' : ''}</strong> pour couvrir le total investi : marketing ({Math.round(marketingCostNum)} €){quantityNum > 0 && <> + stock ({Math.round(totalProductionCost)} €)</>}.
                </p>
                {quantityNum > 0 && breakEvenPieces > quantityNum && (
                  <p className="text-xs text-amber-600 mt-2">
                    Attention : votre stock ({quantityNum} pcs) ne suffit pas pour atteindre le point mort. Il faudrait vendre {breakEvenPieces} pièces.
                  </p>
                )}
              </div>
            )}

            {/* MoQ — budget de lancement : coût total à investir + gain potentiel si tout vendu */}
            {cogs > 0 && sellingPriceNum > 0 && (
              <div className="rounded-lg border border-border bg-muted/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Budget de lancement (MoQ)</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Quantité minimale imposée par l&apos;usine. Montants en <strong className="text-foreground">total</strong> : budget à investir (production + marketing), puis si tout est vendu → CA, marge brute et bénéfice net.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[50, 100, 200, 300].map((moq) => {
                    const unitCogsMoq = baseUnitCogs * getDegressiveFactor(moq);
                    const budgetTotal = unitCogsMoq * moq + marketingCostNum;
                    const caTotal = sellingPriceNum * moq;
                    const margeBruteTotale = caTotal - unitCogsMoq * moq;
                    const beneficeNetTotal = margeBruteTotale - marketingCostNum;
                    const isSelected = quantityNum === moq;
                    return (
                      <button
                        key={moq}
                        type="button"
                        onClick={() => setQuantity(String(moq))}
                        className={`rounded-lg border-2 p-3 text-left transition-colors ${isSelected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
                          }`}
                      >
                        <div className="text-xs font-semibold text-foreground">MoQ {moq} pcs</div>
                        <div className="text-xs text-muted-foreground mt-1.5">À investir (total)</div>
                        <div className="text-base font-bold text-foreground">{Math.round(budgetTotal)} €</div>
                        <div className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/50">Si tout vendu :</div>
                        <div className="text-[10px] text-foreground mt-0.5">CA {Math.round(caTotal)} € · Marge {Math.round(margeBruteTotale)} € · Bénéfice net <span className={beneficeNetTotal >= 0 ? 'text-green-600 font-semibold' : 'text-destructive'}>{Math.round(beneficeNetTotal)} €</span></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Résultats : par pièce, totaux (si tout vendu), risque */}
            {sellingPriceNum > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground mb-1">Marge brute <span className="text-xs">(par pièce)</span></div>
                    <div className="text-2xl font-semibold text-foreground">{grossMargin.toFixed(2)} €</div>
                    <div className="text-sm text-muted-foreground">({grossMarginPercent}%)</div>
                  </div>
                  <div className={`rounded-lg border-2 p-4 ${isViable ? 'border-primary/40 bg-primary/5' : 'border-destructive/40 bg-destructive/5'}`}>
                    <div className="text-sm text-muted-foreground mb-1">Marge nette <span className="text-xs">(par pièce)</span></div>
                    <div className={`text-2xl font-semibold ${isViable ? 'text-primary' : 'text-destructive'}`}>{netMargin.toFixed(2)} €</div>
                    <div className={`text-sm ${isViable ? 'text-primary' : 'text-destructive'}`}>({netMarginPercent}%)</div>
                    {isViable ? <div className="text-xs text-primary font-medium mt-2">✓ Projet viable</div> : <div className="text-xs text-destructive font-medium mt-2">⚠ Marge &lt; 20%</div>}
                  </div>
                </div>
                {quantityNum > 0 && (
                  <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Au total pour {quantityNum} pièces (si tout est vendu)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Chiffre d&apos;affaires</div>
                        <div className="text-lg font-semibold text-foreground">{Math.round(totalRevenue)} €</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Coût production</div>
                        <div className="text-lg font-semibold text-foreground">{Math.round(totalProductionCost)} €</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Marge brute totale</div>
                        <div className="text-lg font-semibold text-foreground">{Math.round(totalGrossMargin)} €</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Bénéfice net total</div>
                        <div className={`text-lg font-semibold ${totalNetProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>{Math.round(totalNetProfit)} €</div>
                        <div className="text-xs text-muted-foreground">après marketing {marketingCostNum} €</div>
                      </div>
                    </div>
                  </div>
                )}
                {sellingPriceNum > 0 && cogs > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${riskLevel === 'green' ? 'bg-green-500' : riskLevel === 'orange' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, grossMarginNum)}%` }} />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${riskLevel === 'green' ? 'bg-green-100 text-green-800' : riskLevel === 'orange' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {riskLevel === 'green' && (grossMarginNum >= 65 ? 'Luxe accessible (65%+)' : 'Marge saine')}
                      {riskLevel === 'orange' && 'Marge 50–65%'}
                      {riskLevel === 'red' && 'Marge &lt;50%'}
                    </span>
                  </div>
                )}
                {quantityNum > 0 && costPerUnit > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Coût unitaire : <strong className="text-foreground">{costPerUnit.toFixed(2)} €</strong> · Marge nette/pièce : <strong className="text-foreground">{marginPerUnit.toFixed(2)} €</strong>
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={isSaving || sellingPriceNum === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Archivage du scénario financier…</> : isCompleted ? 'Enregistrer les modifications' : 'Valider cette étape'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {isCompleted && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm font-semibold text-foreground">Calculatrice enregistrée</div>
              <div className="text-xs text-muted-foreground">
                Vous pouvez enregistrer ce calcul dans un fichier (collection) ou passer au Design.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enregistrer ce calcul dans un fichier (collection) — plusieurs articles par fichier */}
      {sellingPriceNum > 0 && (
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-primary" />
              Enregistrer dans un fichier (collection)
            </CardTitle>
            <CardDescription>
              Associez ce chiffre de rentabilité à un fichier pour regrouper plusieurs articles (calculs, designs, scripts UGC).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!saveToFileOpen ? (
              <Button variant="outline" onClick={() => setSaveToFileOpen(true)} className="gap-2">
                <Save className="w-4 h-4" />
                Choisir un fichier ou en créer un
              </Button>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Fichier existant</label>
                    <select
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                      disabled={!!newCollectionName.trim()}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">— Sélectionner —</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Ou nouveau fichier</label>
                    <Input
                      placeholder="Nom du fichier"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onFocus={() => setSelectedCollectionId('')}
                      className="h-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nom de l’article (optionnel)</label>
                  <Input
                    placeholder="Ex. T-shirt blanc 180 g/m²"
                    value={articleLabel}
                    onChange={(e) => setArticleLabel(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleSaveToFile}
                    disabled={savingToFile || (!selectedCollectionId && !newCollectionName.trim())}
                    className="gap-2"
                  >
                    {savingToFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingToFile ? 'Ajout…' : 'Ajouter au fichier'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSaveToFileOpen(false)}>Fermer</Button>
                  {saveToFileDone && <span className="text-sm text-green-600">Article ajouté au fichier.</span>}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
