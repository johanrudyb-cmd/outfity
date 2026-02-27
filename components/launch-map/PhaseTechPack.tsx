'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Ruler,
  Upload,
  Check,
  FileText,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { BrandIdentity } from './LaunchMapStepper';
import {
  BASE_DIMENSIONS_BY_PRODUCT,
  DIMENSION_LABELS,
  GARMENT_SIZES,
  type GarmentDimensions,
  type ProductTypeKey,
} from '@/lib/techpack-base-dimensions';
import { TechPackSheet } from '@/components/design-studio/TechPackSheet';
import { MockupPackSelector } from './MockupPackSelector';
import {
  getPlacementsForMockupType,
  getDimensionKeyForMockupType,
  PLACEMENTS_BY_MOCKUP_TYPE,
} from '@/lib/mockup-techpack-mapping';

const PRODUCT_TYPE_LABELS: Record<ProductTypeKey, string> = {
  tshirt: 'T-shirt',
  hoodie: 'Hoodie',
  sweat: 'Sweat',
  polo: 'Polo',
  veste: 'Veste',
  pantalon: 'Pantalon',
};

const FABRIC_OPTIONS = [
  { value: '', label: 'Choisir une matière' },
  { value: 'Coton 100%', label: 'Coton 100%' },
  { value: 'Coton jersey', label: 'Coton jersey' },
  { value: 'Coton fleece', label: 'Coton fleece' },
  { value: 'Polyester', label: 'Polyester' },
  { value: 'Mélange coton/polyester', label: 'Mélange coton/polyester' },
  { value: 'Mélange coton/élasthanne', label: 'Mélange coton/élasthanne' },
  { value: 'French terry', label: 'French terry' },
  { value: 'Molleton', label: 'Molleton' },
  { value: 'Polyester mesh', label: 'Polyester mesh' },
  { value: 'Autre', label: 'Autre (préciser)' },
];

const PRINT_TYPE_OPTIONS = [
  { value: '', label: "Type d'impression" },
  { value: 'Sérigraphie', label: 'Sérigraphie' },
  { value: 'Broderie', label: 'Broderie' },
  { value: 'Transfert thermique', label: 'Transfert thermique' },
  { value: 'DTF', label: 'DTF (Direct to Film)' },
  { value: 'Sublimation', label: 'Sublimation' },
  { value: 'Flex', label: 'Flex / Flock' },
  { value: 'Vinyle', label: 'Vinyle' },
  { value: 'Flock', label: 'Flock' },
  { value: 'Pas d\'impression', label: "Pas d'impression" },
];

const CATEGORY_OPTIONS = [
  { value: 'TOP', label: 'Haut' },
  { value: 'BOTTOM', label: 'Bas' },
  { value: 'DRESS', label: 'Robe' },
  { value: 'OUTERWEAR', label: 'Vêtement d\'extérieur' },
  { value: 'ACCESSORIES', label: 'Accessoires' },
  { value: 'ONE-PIECE', label: 'Combiné' },
  { value: 'UNDERWEAR', label: 'Sous-vêtements' },
  { value: 'SWIMWEAR', label: 'Maillot de bain' },
  { value: 'AUTRE', label: 'Autre' },
];

interface PhaseTechPackProps {
  brandId: string;
  brand?: BrandIdentity | null;
  onComplete: () => void;
  /** Si true, ne redirige pas après sauvegarde — le parent gère le rafraîchissement */
  standalone?: boolean;
}

const TOTAL_STEPS = 6; // 1=type, 2=dimensions ref, 3=import, 4=form tech pack, 5=modifier dims?, 6=confirm+save
const STORAGE_KEY = (b: string) => `launch-map-techpack-design-${b}`;

const DEFAULT_CARE =
  'MACHINE WASH COLD\nWITH LIKE COLORS\nONLY NON-CHLORINE BLEACH WHEN NEEDED\nTUMBLE DRY LOW\nREMOVE PROMPTLY\nWARM IRON AS NEEDED';

/** Types de mockup disponibles (clés du mapping) — triés */
const MOCKUP_TYPES = Object.keys(PLACEMENTS_BY_MOCKUP_TYPE).sort((a, b) => a.localeCompare(b));

export function PhaseTechPack({ brandId, brand, onComplete, standalone }: PhaseTechPackProps) {
  const [step, setStep] = useState(1);
  const [mockupType, setMockupType] = useState<string>('T-shirt');
  const productTypeKey = getDimensionKeyForMockupType(mockupType);
  const placementOptions = getPlacementsForMockupType(mockupType);
  const [uploadedMockupUrl, setUploadedMockupUrl] = useState<string | null>(null);
  const [uploadedBackUrl, setUploadedBackUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingDesign, setIsAddingDesign] = useState(false);
  const fileInputMockupRef = useRef<HTMLInputElement>(null);

  const [season, setSeason] = useState('');
  const [colorMain, setColorMain] = useState('');
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const [fabric, setFabric] = useState('');
  const [fabricOther, setFabricOther] = useState('');
  const [printType, setPrintType] = useState('');
  const [careInstructions, setCareInstructions] = useState(DEFAULT_CARE);
  const [madeIn, setMadeIn] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [printWidth, setPrintWidth] = useState('');
  const [printHeight, setPrintHeight] = useState('');

  const [designName, setDesignName] = useState('');
  const [category, setCategory] = useState('TOP');
  const [issueNo, setIssueNo] = useState('');
  const [outDate, setOutDate] = useState(() => todayStr());
  const [mainLogoUrl, setMainLogoUrl] = useState<string | null>(null);
  const [frontDesignUrl, setFrontDesignUrl] = useState<string | null>(null);
  const [frontDesignWidthIn, setFrontDesignWidthIn] = useState('14');
  const [frontDesignHeightIn, setFrontDesignHeightIn] = useState('8');
  const [designerLogoUrl, setDesignerLogoUrl] = useState<string | null>(null);
  const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  type LabelState = { letter: string; imageUrl: string | null; widthIn: number; heightIn: number; placement: string; type: string; isNeckTag?: boolean };
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [labels, setLabels] = useState<LabelState[]>([
    { letter: 'A', imageUrl: null, widthIn: 14, heightIn: 8, placement: 'Poitrine (centre)', type: 'Logo devant' },
    { letter: 'B', imageUrl: null, widthIn: 14, heightIn: 8, placement: 'Dos', type: 'Logo arrière' },
    { letter: 'C', imageUrl: null, widthIn: 2, heightIn: 2, placement: 'Étiquette de cou', type: 'Neck tag', isNeckTag: true },
  ]);
  const [colorSwatches, setColorSwatches] = useState<{ hex: string }[]>([{ hex: '#1E5182' }, { hex: '#F5F69B' }]);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const fileInputMainLogoRef = useRef<HTMLInputElement>(null);
  const fileInputFrontDesignRef = useRef<HTMLInputElement>(null);
  const fileInputDesignerRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    type: false,
    import: false,
    details: false,
    dimensions: true
  });

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [selectedDesignId, setSelectedDesignIdState] = useState<string | null>(null);

  const [designLoaded, setDesignLoaded] = useState(false);

  const searchParams = useSearchParams();
  const editIdFromUrl = searchParams.get('edit');

  useEffect(() => {
    if (editIdFromUrl) {
      setSelectedDesignIdState(editIdFromUrl);
    } else {
      setSelectedDesignIdState(null);
      try {
        sessionStorage.removeItem(STORAGE_KEY(brandId));
      } catch {
        // ignore
      }
    }
  }, [brandId, editIdFromUrl]);

  useEffect(() => {
    if (!selectedDesignId || designLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/designs/${selectedDesignId}`, { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const design = await res.json();
        if (cancelled) return;
        const tp = (design.techPack || {}) as Record<string, unknown>;
        const sd = (tp.speedDemon || {}) as Record<string, unknown>;
        const mockupSpec = (design.mockupSpec || {}) as Record<string, unknown>;

        setUploadedMockupUrl(design.productImageUrl || null);
        setUploadedBackUrl(design.flatSketchUrl || null);
        setSeason((mockupSpec.season as string) || '');
        setColorMain((mockupSpec.colorMain as string) || '');
        setDesignName((sd.designName as string) || design.type || '');
        setCategory((sd.category as string) || 'TOP');
        setFabric((sd.fabric as string) || design.material || '');
        setPrintType((sd.printType as string) || '');
        setIssueNo((sd.issueNo as string) || '');
        setOutDate((sd.outDate as string) || new Date().toISOString().slice(0, 10));
        setSizes(Array.isArray(sd.sizes) ? sd.sizes as string[] : ['S', 'M', 'L', 'XL']);
        setDesignerName((tp.designerName as string) || (sd.designerName as string) || '');
        setManufacturer((tp.manufacturer as string) || (sd.manufacturer as string) || '');
        setCareInstructions((tp.labeling as string) || DEFAULT_CARE);
        setMadeIn((tp.compliance as string) || '');
        const printSpec = (tp.printSpec || {}) as Record<string, unknown>;
        setPrintWidth(printSpec.width != null ? String(printSpec.width) : '');
        setPrintHeight(printSpec.height != null ? String(printSpec.height) : '');
        setFrontDesignUrl((sd.frontDesignUrl as string) || null);
        setMainLogoUrl((sd.mainLogoUrl as string) || null);
        setDesignerLogoUrl((sd.designerLogoUrl as string) || null);
        if (sd.frontDesignWidthIn != null) setFrontDesignWidthIn(String(sd.frontDesignWidthIn));
        if (sd.frontDesignHeightIn != null) setFrontDesignHeightIn(String(sd.frontDesignHeightIn));
        const pk = ((sd.productTypeKey as ProductTypeKey) || 'tshirt');
        const storedMockupType = sd.mockupType as string | undefined;
        const mt = storedMockupType && MOCKUP_TYPES.includes(storedMockupType)
          ? storedMockupType
          : MOCKUP_TYPES.find((t) => getDimensionKeyForMockupType(t) === pk) || 'T-shirt';
        setMockupType(mt);
        setDesignProductTypeKey(pk);

        const lbls = sd.labels as Array<{ letter?: string; imageUrl?: string | null; widthIn?: number; heightIn?: number; placement?: string; type?: string; isNeckTag?: boolean }> | undefined;
        if (Array.isArray(lbls) && lbls.length > 0) {
          setLabels(lbls.map((l) => ({
            letter: l.letter || 'A',
            imageUrl: l.imageUrl ?? null,
            widthIn: l.widthIn ?? 14,
            heightIn: l.heightIn ?? 8,
            placement: l.placement || 'Poitrine (centre)',
            type: l.type || 'Logo devant',
            isNeckTag: l.isNeckTag ?? false,
          })));
        }

        const swatches = sd.colorSwatches as Array<{ hex?: string }> | undefined;
        if (Array.isArray(swatches) && swatches.length > 0) {
          setColorSwatches(swatches.map((s) => ({ hex: s.hex || '#cccccc' })));
        }

        let dimsBySize: Record<string, Record<string, number>> | undefined =
          sd.dimensionsBySize as Record<string, Record<string, number>> | undefined;
        if (!dimsBySize || Object.keys(dimsBySize).length === 0) {
          const mt = tp.measurementsTable as Array<{ size: string; measurements: Record<string, number> }> | undefined;
          if (Array.isArray(mt) && mt.length > 0) {
            const next: Record<string, Record<string, number>> = {};
            mt.forEach((row) => {
              if (row.size && row.measurements) next[row.size] = row.measurements;
            });
            dimsBySize = Object.keys(next).length > 0 ? next : undefined;
          }
        }
        if (dimsBySize && Object.keys(dimsBySize).length > 0) {
          setModifyDimensions(true);
          setDimensionsBySize(dimsBySize);
        }

        setStep(4);
        setDesignLoaded(true);
      } catch (e) {
        console.error('[PhaseTechPack] load design', e);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDesignId, designLoaded]);

  const setSelectedDesignId = (id: string | null) => {
    setSelectedDesignIdState(id);
  };
  const [modifyDimensions, setModifyDimensions] = useState<boolean | null>(null);
  const [dimensionsBySize, setDimensionsBySize] = useState<Record<string, GarmentDimensions>>({});
  const [designProductTypeKey, setDesignProductTypeKey] = useState<ProductTypeKey>('tshirt');
  const [saving, setSaving] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [dimensionsClassiquesOpen, setDimensionsClassiquesOpen] = useState(false);

  useEffect(() => {
    const key = productTypeKey;
    setDesignProductTypeKey(key);
    if (modifyDimensions === true && !(selectedDesignId && designLoaded)) {
      const base = BASE_DIMENSIONS_BY_PRODUCT[key];
      if (base) {
        const next: Record<string, GarmentDimensions> = {};
        GARMENT_SIZES.forEach((size) => {
          if (base[size]) next[size] = { ...base[size] };
        });
        setDimensionsBySize(next);
      }
    }
  }, [productTypeKey, modifyDimensions, selectedDesignId, designLoaded]);

  // Migrer les placements invalides quand le type de mockup change (pas au montage initial)
  const mockupTypeInitialized = useRef(false);
  useEffect(() => {
    if (!mockupTypeInitialized.current) {
      mockupTypeInitialized.current = true;
      return;
    }
    const opts = getPlacementsForMockupType(mockupType);
    if (opts.length === 0) return;
    setLabels((prev) => {
      const next = prev.map((l) => {
        const valid = opts.includes(l.placement);
        return valid ? l : { ...l, placement: opts[0] || l.placement };
      });
      const changed = prev.some((l, i) => next[i]?.placement !== l.placement);
      return changed ? next : prev;
    });
  }, [mockupType]);

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
    else if (step === 5 && modifyDimensions !== null) setStep(6);
    else if (step === 6) void handleSaveAndComplete();
  };

  const ensureDesignFromUpload = async (): Promise<{ designId: string | null; error?: string }> => {
    if (selectedDesignId) return { designId: selectedDesignId };
    if (!uploadedMockupUrl) return { designId: null, error: 'Importez votre mockup (un document devant + dos).' };
    const res = await fetch('/api/designs/create-from-mockup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId,
        productImageUrl: uploadedMockupUrl,
        backImageUrl: uploadedMockupUrl,
        questionnaire: { productType: PRODUCT_TYPE_LABELS[productTypeKey] || 'T-shirt' },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data?.error as string) || `Erreur ${res.status}`;
      return { designId: null, error: msg };
    }
    const id = data.design?.id ?? null;
    if (id) setSelectedDesignId(id);
    return { designId: id };
  };

  const handleContinueFromStep3 = async () => {
    if (!uploadedMockupUrl) return;
    setIsAddingDesign(true);
    try {
      const { designId, error } = await ensureDesignFromUpload();
      if (!designId) alert(error || 'Erreur lors de la création du design. Réessayez.');
    } finally {
      setIsAddingDesign(false);
    }
  };

  const handleSaveAndComplete = async () => {
    let designId = selectedDesignId;
    if (!designId && uploadedMockupUrl) {
      const out = await ensureDesignFromUpload();
      designId = out.designId;
      if (!designId) {
        alert(out.error || 'Importez d\'abord votre mockup à l\'étape 3.');
        return;
      }
    }
    if (!designId) {
      alert('Importez d\'abord votre mockup à l\'étape 3.');
      return;
    }
    setSaving(true);
    try {
      let measurementsTable: { size: string; measurements: Record<string, number> }[] | undefined;
      if (modifyDimensions === true) {
        measurementsTable = Object.entries(dimensionsBySize)
          .filter(([, dim]) => dim && typeof dim === 'object')
          .map(([size, dim]) => {
            const measurements: Record<string, number> = {};
            Object.entries(dim).forEach(([k, v]) => {
              if (typeof v === 'number') measurements[k] = v;
            });
            return { size, measurements };
          });
      } else {
        measurementsTable = undefined;
      }

      const speedDemon = {
        designName: designName || undefined,
        fabric: (fabric === 'Autre' ? fabricOther : fabric) || undefined,
        category: category || undefined,
        issueNo: issueNo || undefined,
        inDate: todayStr(),
        outDate: outDate || undefined,
        sizes: sizes.length ? sizes : undefined,
        dimensionsBySize: (modifyDimensions === true && Object.keys(dimensionsBySize).length > 0 ? dimensionsBySize : undefined),
        productTypeKey: designProductTypeKey,
        mockupType: mockupType,
        printType: printType || undefined,
        mainLogoUrl: mainLogoUrl || undefined,
        frontDesignUrl: labels[0]?.imageUrl || frontDesignUrl || undefined,
        frontDesignWidthIn: labels[0]?.widthIn ?? (frontDesignWidthIn ? parseFloat(frontDesignWidthIn) : 14),
        frontDesignHeightIn: labels[0]?.heightIn ?? (frontDesignHeightIn ? parseFloat(frontDesignHeightIn) : 8),
        labels: labels.map((l) => ({
          letter: l.letter,
          imageUrl: l.imageUrl || undefined,
          widthIn: l.widthIn,
          heightIn: l.heightIn,
          placement: l.placement,
          type: l.type,
          isNeckTag: l.isNeckTag,
        })),
        designerLogoUrl: designerLogoUrl || undefined,
        designerName: designerName || undefined,
        manufacturer: manufacturer || undefined,
        colorSwatches: colorSwatches.filter((s) => s.hex?.trim()),
      };

      const res = await fetch(`/api/designs/${designId}/tech-pack-dimensions`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modifyDimensions: modifyDimensions === true,
          measurementsTable,
          season: season || undefined,
          colorMain: colorMain || undefined,
          material: fabric || undefined,
          labeling: careInstructions || undefined,
          compliance: madeIn || undefined,
          designerName: designerName || undefined,
          manufacturer: manufacturer || undefined,
          printWidth: printWidth ? parseFloat(printWidth) : undefined,
          printHeight: printHeight ? parseFloat(printHeight) : undefined,
          speedDemon,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = (err?.error as string) || `Erreur ${res.status}`;
        alert(`Impossible d\'enregistrer le tech pack : ${message}`);
        return;
      }
      setJustCompleted(true);
      onComplete();
      if (!standalone) {
        window.location.href = '/launch-map/tech-packs';
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau ou serveur. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('brandId', brandId);
    const res = await fetch('/api/ugc/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Erreur lors de l'import");
    }
    const data = await res.json();
    return data.url ?? null;
  };

  const handleMockupFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploading(true);
    setUploadedMockupUrl(null);
    setUploadedBackUrl(null);
    try {
      const url = await uploadFile(file);
      setUploadedMockupUrl(url);
      setUploadedBackUrl(url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erreur lors de l'import");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'mainLogo' | 'frontDesign' | 'designer' | 'label', labelIndex = 0) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingLogo(kind === 'label' ? `label-${labelIndex}` : kind);
    try {
      const url = await uploadFile(file);
      if (kind === 'mainLogo') setMainLogoUrl(url);
      else if (kind === 'frontDesign') {
        setFrontDesignUrl(url);
        setLabels((prev) => prev.map((l, i) => (i === 0 ? { ...l, imageUrl: url } : l)));
      } else if (kind === 'designer') setDesignerLogoUrl(url);
      else if (kind === 'label') setLabels((prev) => prev.map((l, i) => (i === labelIndex ? { ...l, imageUrl: url } : l)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploadingLogo(null);
      e.target.value = '';
    }
  };


  const canNext =
    step === 1 ||
    step === 2 ||
    step === 3 ||
    step === 4 ||
    (step === 5 && modifyDimensions !== null) ||
    step === 6;

  const dimensionsRefBySize = BASE_DIMENSIONS_BY_PRODUCT[productTypeKey];
  const sizeKeysRef = dimensionsRefBySize ? (GARMENT_SIZES.filter((s) => dimensionsRefBySize[s]) as string[]) : [];
  const dimensionKeysRef = dimensionsRefBySize?.['M']
    ? (Object.keys(dimensionsRefBySize['M']) as (keyof GarmentDimensions)[])
    : [];

  const dimensionKeys = (Object.keys(BASE_DIMENSIONS_BY_PRODUCT[designProductTypeKey]?.M || {}) as (keyof GarmentDimensions)[]);
  const sizesForForm = (GARMENT_SIZES.filter((s) => BASE_DIMENSIONS_BY_PRODUCT[designProductTypeKey]?.[s]) as string[]);

  /** Mode édition : on modifie un tech pack existant (chargé depuis sessionStorage) */
  const isEditMode = Boolean(selectedDesignId && designLoaded);
  const hasImagesForSave = Boolean(uploadedMockupUrl);

  if (justCompleted) {
    return (
      <div className="max-w-2xl mx-auto min-h-[420px] flex flex-col">
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">{isEditMode ? 'Tech pack mis à jour' : 'Tech pack créé avec succès'}</h3>
            <p className="text-muted-foreground mb-6">
              {isEditMode ? 'Vos modifications ont été enregistrées.' : 'Votre tech pack a été enregistré. Consultez-le dans l\'app ou continuez vers le Sourcing.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/launch-map/tech-packs"
                className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
              >
                {isEditMode ? 'Retour à Mes tech packs' : 'Voir Mes tech packs'}
              </Link>
              {selectedDesignId && (
                <Link
                  href={`/designs/${selectedDesignId}/tech-pack`}
                  target="_blank"
                  className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-lg border-2 border-border hover:bg-muted hover:border-primary/50 transition-all gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Voir le tech pack
                </Link>
              )}
              {!isEditMode && (
                <Link
                  href="/launch-map/phase/5"
                  className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-lg border-2 border-border hover:bg-muted hover:border-primary/50 transition-all"
                >
                  Continuer vers le Sourcing
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-[400px] lg:h-[calc(100vh-180px)] lg:flex lg:flex-col lg:overflow-hidden relative">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden sticky top-0 z-50 bg-background border-b flex p-1 gap-1">
        <button
          onClick={() => setMobileTab('form')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all",
            mobileTab === 'form' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
          )}
        >
          <FileText className="w-4 h-4" />
          Éditer
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all",
            mobileTab === 'preview' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Aperçu
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(380px,480px)_1fr] gap-0 xl:flex-1 xl:min-h-0 xl:overflow-hidden">
        <div className={cn(
          "border-b xl:border-b-0 xl:border-r border-border overflow-y-auto p-4 xl:p-6 space-y-6 bg-background xl:min-h-0",
          mobileTab !== 'form' && "hidden xl:block"
        )}>
          <div>
            <h2 className="text-lg font-semibold mb-1">{isEditMode ? 'Modifier le tech pack' : 'Remplir le tech pack'}</h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode ? 'Modifiez les champs ci-dessous. L\'aperçu se met à jour en direct.' : 'Formulaire à gauche, aperçu en direct à droite.'}
            </p>
            {isEditMode && (
              <Link href="/launch-map/tech-packs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-2">
                ← Retour aux tech packs
              </Link>
            )}
          </div>
          {/* 1. Type de produit */}
          <Card className="border-2 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('type')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                1. Type de produit
              </CardTitle>
              <ChevronDown className={cn("w-5 h-5 transition-transform", !collapsedSections.type && "rotate-180")} />
            </button>
            {!collapsedSections.type && (
              <CardContent className="pt-0 space-y-4">
                <CardDescription>Sélectionnez le type de vêtement pour votre mockup.</CardDescription>
                <div className="flex flex-wrap gap-2">
                  {MOCKUP_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMockupType(t)}
                      className={cn(
                        "px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all",
                        mockupType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* 2. Dimensions classiques — menu déroulant */}
          {true && (
            <Card className="border-2">
              <button
                type="button"
                onClick={() => setDimensionsClassiquesOpen((o) => !o)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
              >
                <CardTitle className="flex items-center gap-2 text-base m-0"><Ruler className="w-5 h-5 text-primary" /> Dimensions classiques par taille</CardTitle>
                <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${dimensionsClassiquesOpen ? 'rotate-180' : ''}`} />
              </button>
              {dimensionsClassiquesOpen && (
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">Dimensions de référence pour un {mockupType} (XS à XXL). Utilisez ces valeurs pour créer votre mockup en dehors de l&apos;app.</CardDescription>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b"><th className="text-left p-2 font-medium">Dimension</th>{sizeKeysRef.map((size) => (<th key={size} className="p-2 font-medium text-center">{size}</th>))}</tr>
                      </thead>
                      <tbody>
                        {dimensionKeysRef.map((dimKey) => (
                          <tr key={dimKey} className="border-b border-border/50">
                            <td className="p-2 text-muted-foreground">{DIMENSION_LABELS[dimKey] ?? dimKey}</td>
                            {sizeKeysRef.map((size) => { const val = dimensionsRefBySize?.[size]?.[dimKey]; return <td key={size} className="p-2 text-center">{typeof val === 'number' ? `${val} cm` : '—'}</td>; })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <MockupPackSelector brandId={brandId} brandName={brand?.name} inline />
                </CardContent>
              )}
            </Card>
          )}

          {/* Étape 3 : Import du mockup */}
          <Card className="border-2 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('import')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                2. Import du Mockup
              </CardTitle>
              <ChevronDown className={cn("w-5 h-5 transition-transform", !collapsedSections.import && "rotate-180")} />
            </button>
            {!collapsedSections.import && (
              <CardContent className="pt-0 space-y-4">
                <CardDescription>Importez un document devant + dos (PNG/JPG).</CardDescription>
                <input ref={fileInputMockupRef} type="file" accept="image/*" className="hidden" onChange={handleMockupFileChange} />
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputMockupRef.current?.click()}
                >
                  {uploadedMockupUrl ? (
                    <div className="space-y-2">
                      <img src={uploadedMockupUrl} alt="Mockup" className="max-h-32 mx-auto object-contain rounded shadow-sm" />
                      <p className="text-[10px] text-muted-foreground">Cliquez pour modifier</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : <Upload className="w-8 h-8 text-muted-foreground mx-auto" />}
                      <p className="text-xs font-bold mt-2">Importer le mockup</p>
                    </div>
                  )}
                </div>
                {!isEditMode && (
                  <Button onClick={handleContinueFromStep3} disabled={!uploadedMockupUrl || isAddingDesign} className="w-full h-11 text-sm font-bold shadow-apple">
                    {isAddingDesign ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Assemblage des calques...</> : 'Initialiser avec cette image'}
                  </Button>
                )}
              </CardContent>
            )}
          </Card>

          {/* Étape 4 : Compléter le tech pack */}
          <Card className="border-2 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('details')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                3. Détails Techniques
              </CardTitle>
              <ChevronDown className={cn("w-5 h-5 transition-transform", !collapsedSections.details && "rotate-180")} />
            </button>
            {!collapsedSections.details && (
              <CardContent className="pt-0 space-y-6">
                <input ref={fileInputMainLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'mainLogo')} />
                <input ref={fileInputFrontDesignRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'frontDesign')} />
                <input ref={fileInputDesignerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'designer')} />

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary">Spécifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Saison</Label>
                      <Input placeholder="ex. SS26" value={season} onChange={(e) => setSeason(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <Label>Nom du design</Label>
                      <Input placeholder="ex. SPEED DEMON" value={designName} onChange={(e) => setDesignName(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm h-9">
                        {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Matière</Label>
                      <select value={fabric} onChange={(e) => setFabric(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm h-9">
                        {FABRIC_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                      </select>
                      {fabric === 'Autre' && <Input placeholder="Préciser" value={fabricOther} onChange={(e) => setFabricOther(e.target.value)} className="mt-1 h-9 text-sm" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary">Logos et Emplacements</h4>
                  {labels.map((lb, idx) => (
                    <div key={`${lb.letter}-${idx}`} className="border rounded-lg p-2 space-y-2 bg-muted/20">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-primary text-xs">[{lb.letter}]</span>
                        <span className="text-xs font-semibold flex-1 truncate">{lb.type}</span>
                        <input type="file" accept="image/*" className="hidden" id={`label-${idx}`} onChange={(e) => idx === 0 ? handleLogoUpload(e, 'frontDesign') : handleLogoUpload(e, 'label', idx)} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => document.getElementById(`label-${idx}`)?.click()} disabled={uploadingLogo === (idx === 0 ? 'frontDesign' : `label-${idx}`)} className="h-7 text-[10px] px-2 border">
                          {lb.imageUrl ? 'Changer' : 'Logo'}
                        </Button>
                        {lb.imageUrl && <img src={lb.imageUrl} alt="" className="h-6 w-6 object-contain border rounded" />}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
                        <div className="col-span-1">
                          <Label className="text-[10px] text-[#8E8E93] font-bold uppercase mb-1 block">Emplacement</Label>
                          <select value={lb.placement} onChange={(e) => setLabels((prev) => prev.map((l, i) => (i === idx ? { ...l, placement: e.target.value } : l)))} className="w-full rounded-lg border border-input bg-background px-2 py-1 text-[10px] h-8 focus:ring-1 focus:ring-primary">
                            {placementOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <Label className="text-[10px] text-[#8E8E93] font-bold uppercase mb-1 block">Largeur (in)</Label>
                          <Input type="number" step={0.5} value={lb.widthIn} onChange={(e) => setLabels((prev) => prev.map((l, i) => (i === idx ? { ...l, widthIn: parseFloat(e.target.value) || 0 } : l)))} className="h-8 text-[10px] px-2 rounded-lg" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Label className="text-[10px] text-[#8E8E93] font-bold uppercase mb-1 block">Hauteur (in)</Label>
                          <Input type="number" step={0.5} value={lb.heightIn} onChange={(e) => setLabels((prev) => prev.map((l, i) => (i === idx ? { ...l, heightIn: parseFloat(e.target.value) || 0 } : l)))} className="h-8 text-[10px] px-2 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => setLabels((prev) => [...prev, { letter: String.fromCharCode(65 + prev.length), imageUrl: null, widthIn: 14, heightIn: 8, placement: placementOptions[0] || 'Poitrine (centre)', type: 'Logo supp.' }])}>
                    + Ajouter un logo
                  </Button>
                </div>

                <div className="pt-2">
                  <Label className="text-sm font-semibold text-primary">Fabricant / Marque</Label>
                  <Input placeholder="ex. Voltrix" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="mt-1 h-9 text-sm" />
                </div>
              </CardContent>
            )}
          </Card>

          {/* 10. Modifier dimensions ? */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Dimensions du vêtement</CardTitle>
              <CardDescription className="text-xs">Modifier les valeurs par taille ?</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button variant={modifyDimensions === true ? 'default' : 'outline'} size="sm" onClick={() => setModifyDimensions(true)}>Oui</Button>
                <Button variant={modifyDimensions === false ? 'default' : 'outline'} size="sm" onClick={() => setModifyDimensions(false)}>Non</Button>
              </div>
              {modifyDimensions === true && (

                <div className="mt-4 space-y-3 max-h-[240px] overflow-y-auto">
                  {sizesForForm.map((size) => (
                    <Card key={size}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Taille {size}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        {dimensionKeys.map((key) => (
                          <div key={key}>
                            <Label className="text-xs">{DIMENSION_LABELS[key]}</Label>
                            <Input
                              type="number"
                              step={0.5}
                              value={dimensionsBySize[size]?.[key] ?? ''}
                              onChange={(e) => {
                                const v = e.target.value ? parseFloat(e.target.value) : undefined;
                                setDimensionsBySize((prev) => ({
                                  ...prev,
                                  [size]: { ...prev[size], [key]: v },
                                }));
                              }}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Boutons — logique adaptée selon création vs modification */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex flex-col sm:flex-row gap-2">
              {isEditMode && (
                <Link href="/launch-map/tech-packs" className="inline-flex justify-center" replace>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Annuler
                  </Button>
                </Link>
              )}
              <Button
                onClick={() => void handleSaveAndComplete()}
                disabled={saving || !hasImagesForSave}
                className={`gap-2 ${isEditMode ? 'flex-1' : 'w-full'}`}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Ciselage du pack technique...</>
                ) : isEditMode ? (
                  'Enregistrer les modifications'
                ) : (
                  'Valider et créer le tech pack'
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-6 font-medium leading-relaxed italic">
              Les spécifications techniques sont fournies à titre indicatif pour le prototypage. <br />
              Nous recommandons de faire valider ces mesures par un modéliste professionnel avant toute production en série.
            </p>
          </div>
        </div>

        {/* Droite : tech pack en direct — reste visible pendant le défilement du formulaire */}
        <div className={cn(
          "p-4 xl:p-6 bg-muted/30 overflow-y-auto xl:min-h-0",
          mobileTab !== 'preview' && "hidden xl:block"
        )}>
          <div className="rounded-lg overflow-hidden border-2 border-border bg-stone-100 shadow-lg">
            <TechPackSheet
              design={{
                id: selectedDesignId || 'preview',
                type: designName || mockupType,
                cut: null,
                material: fabric,
                productImageUrl: uploadedMockupUrl,
                flatSketchUrl: uploadedBackUrl,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                techPack: {
                  speedDemon: {
                    designName,
                    fabric: fabric === 'Autre' ? fabricOther : fabric,
                    category,
                    issueNo: issueNo || (selectedDesignId ? selectedDesignId.slice(-6).toUpperCase() : '—'),
                    inDate: todayStr(),
                    outDate,
                    sizes,
                    dimensionsBySize: (modifyDimensions === true && Object.keys(dimensionsBySize).length > 0 ? dimensionsBySize : BASE_DIMENSIONS_BY_PRODUCT[designProductTypeKey]) || {},
                    productTypeKey: designProductTypeKey,
                    mockupType: mockupType,
                    printType: printType || undefined,
                    labels: labels.map((l) => ({ letter: l.letter, imageUrl: l.imageUrl || undefined, widthIn: l.widthIn, heightIn: l.heightIn, placement: l.placement, type: l.type, isNeckTag: l.isNeckTag })),
                    designerLogoUrl: designerLogoUrl || undefined,
                    designerName: designerName || undefined,
                    manufacturer: manufacturer || undefined,
                    colorSwatches: colorSwatches.filter((s) => s.hex?.trim()),
                  },
                },
                mockupSpec: { season },
                brand: { name: brand?.name ?? null, logo: brand?.logo ?? null },
              }}
              designerName={designerName}
              manufacturer={manufacturer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
