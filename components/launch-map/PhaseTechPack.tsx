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
  ArrowLeft,
  Fullscreen,
  Eye,
  X,
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

const SMART_SUGGESTIONS: Record<string, { fabric: string; care: string }> = {
  'hoodie': { fabric: '100% Cotton Fleece, 400gsm', care: 'Lavage à 30°C, pas de sèche-linge, repassage à l\'envers.' },
  'tshirt': { fabric: '100% Single Jersey Cotton, 240gsm', care: 'Lavage à 30°C, ne pas javelliser, repassage doux.' },
  'sweat': { fabric: '100% French Terry Cotton, 350gsm', care: 'Lavage à 30°C, pas de sèche-linge.' },
  'pantalon': { fabric: 'Heavy Cotton Twill, 280gsm', care: 'Lavage à froid, séchage air libre.' },
  'accessoires': { fabric: '100% Acrylic or Wool blend', care: 'Lavage à la main recommandé.' },
};

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
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [step, setStep] = useState(1);
  const [mockupType, setMockupType] = useState<string>('T-shirt');
  const productTypeKey = getDimensionKeyForMockupType(mockupType);
  const placementOptions = getPlacementsForMockupType(mockupType);
  const [uploadedMockupUrl, setUploadedMockupUrl] = useState<string | null>(null);
  const [uploadedBackUrl, setUploadedBackUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingDesign, setIsAddingDesign] = useState(false);
  const [designs, setDesigns] = useState<any[]>([]);
  const [designsLoading, setDesignsLoading] = useState(true);
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
    { letter: 'C', imageUrl: null, widthIn: 4, heightIn: 4, placement: 'Manche gauche', type: 'Logo manche gauche' },
    { letter: 'D', imageUrl: null, widthIn: 4, heightIn: 4, placement: 'Manche droite', type: 'Logo manche droite' },
    { letter: 'E', imageUrl: null, widthIn: 2, heightIn: 2, placement: 'Étiquette de cou', type: 'Neck tag', isNeckTag: true },
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
  const [draftLoaded, setDraftLoaded] = useState(false);

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
        const pk = ((sd.productTypeKey as ProductTypeKey) || 'tshirt');
        setFabric((sd.fabric as string) || design.material || SMART_SUGGESTIONS[pk]?.fabric || '');
        setPrintType((sd.printType as string) || '');
        setIssueNo((sd.issueNo as string) || '');
        setOutDate((sd.outDate as string) || new Date().toISOString().slice(0, 10));
        setSizes(Array.isArray(sd.sizes) ? sd.sizes as string[] : ['S', 'M', 'L', 'XL']);
        setDesignerName((tp.designerName as string) || (sd.designerName as string) || '');
        setManufacturer((tp.manufacturer as string) || (sd.manufacturer as string) || '');
        setCareInstructions((tp.labeling as string) || SMART_SUGGESTIONS[pk]?.care || DEFAULT_CARE);
        setMadeIn((tp.compliance as string) || '');
        const printSpec = (tp.printSpec || {}) as Record<string, unknown>;
        setPrintWidth(printSpec.width != null ? String(printSpec.width) : '');
        setPrintHeight(printSpec.height != null ? String(printSpec.height) : '');
        setFrontDesignUrl((sd.frontDesignUrl as string) || null);
        setMainLogoUrl((sd.mainLogoUrl as string) || null);
        setDesignerLogoUrl((sd.designerLogoUrl as string) || null);
        if (sd.frontDesignWidthIn != null) setFrontDesignWidthIn(String(sd.frontDesignWidthIn));
        if (sd.frontDesignHeightIn != null) setFrontDesignHeightIn(String(sd.frontDesignHeightIn));
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
    if (!brandId) return;
    fetch(`/api/designs?brandId=${brandId}`)
      .then(res => res.json())
      .then(data => {
        setDesigns((data.designs || []).filter((d: any) => d.productImageUrl));
        setDesignsLoading(false);
      })
      .catch(() => setDesignsLoading(false));
  }, [brandId]);

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

  // Load draft from localStorage (only for NEW designs)
  useEffect(() => {
    if (editIdFromUrl || draftLoaded) return;
    const saved = localStorage.getItem(`techpack-draft-${brandId}`);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.season) setSeason(d.season);
        if (d.designName) setDesignName(d.designName);
        if (d.fabric) setFabric(d.fabric);
        if (d.fabricOther) setFabricOther(d.fabricOther);
        if (d.printType) setPrintType(d.printType);
        if (d.careInstructions) setCareInstructions(d.careInstructions);
        if (d.madeIn) setMadeIn(d.madeIn);
        if (d.designerName) setDesignerName(d.designerName);
        if (d.manufacturer) setManufacturer(d.manufacturer);
        if (d.sizes) setSizes(d.sizes);
        if (d.labels) setLabels(d.labels);
        if (d.colorSwatches) setColorSwatches(d.colorSwatches);
        if (d.uploadedMockupUrl) setUploadedMockupUrl(d.uploadedMockupUrl);
        if (d.uploadedBackUrl) setUploadedBackUrl(d.uploadedBackUrl);
        if (d.dimensionsBySize) setDimensionsBySize(d.dimensionsBySize);
        if (d.mockupType) setMockupType(d.mockupType);
        if (d.category) setCategory(d.category);
        if (d.issueNo) setIssueNo(d.issueNo);
        if (d.outDate) setOutDate(d.outDate);
      } catch (e) { console.warn("Failed to load techpack draft", e); }
    }
    setDraftLoaded(true);
  }, [brandId, editIdFromUrl, draftLoaded]);

  // Save draft to localStorage (autosave)
  useEffect(() => {
    if (editIdFromUrl || justCompleted) return;
    const timer = setTimeout(() => {
      const draft = {
        season, designName, fabric, fabricOther, printType,
        careInstructions, madeIn, designerName, manufacturer,
        sizes, labels, colorSwatches, uploadedMockupUrl,
        uploadedBackUrl, dimensionsBySize, mockupType, category,
        issueNo, outDate
      };
      localStorage.setItem(`techpack-draft-${brandId}`, JSON.stringify(draft));
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    brandId, editIdFromUrl, justCompleted, season, designName, fabric, fabricOther,
    printType, careInstructions, madeIn, designerName, manufacturer,
    sizes, labels, colorSwatches, uploadedMockupUrl,
    uploadedBackUrl, dimensionsBySize, mockupType, category, issueNo, outDate
  ]);

  // Cleanup draft on success
  useEffect(() => {
    if (justCompleted && !editIdFromUrl) {
      localStorage.removeItem(`techpack-draft-${brandId}`);
    }
  }, [justCompleted, editIdFromUrl, brandId]);

  // 1. Load draft from DB (only for NEW designs)
  useEffect(() => {
    if (editIdFromUrl || draftLoaded) return;

    (async () => {
      try {
        const res = await fetch(`/api/launch-map/draft?brandId=${brandId}`);
        if (res.ok) {
          const { draft } = await res.json();
          if (draft) {
            if (draft.season) setSeason(draft.season);
            if (draft.designName) setDesignName(draft.designName);
            if (draft.fabric) setFabric(draft.fabric);
            if (draft.fabricOther) setFabricOther(draft.fabricOther);
            if (draft.printType) setPrintType(draft.printType);
            if (draft.careInstructions) setCareInstructions(draft.careInstructions);
            if (draft.madeIn) setMadeIn(draft.madeIn);
            if (draft.designerName) setDesignerName(draft.designerName);
            if (draft.manufacturer) setManufacturer(draft.manufacturer);
            if (draft.sizes) setSizes(draft.sizes);
            if (draft.labels) setLabels(draft.labels);
            if (draft.colorSwatches) setColorSwatches(draft.colorSwatches);
            if (draft.uploadedMockupUrl) setUploadedMockupUrl(draft.uploadedMockupUrl);
            if (draft.uploadedBackUrl) setUploadedBackUrl(draft.uploadedBackUrl);
            if (draft.dimensionsBySize) setDimensionsBySize(draft.dimensionsBySize);
            if (draft.mockupType) setMockupType(draft.mockupType);
            if (draft.category) setCategory(draft.category);
            if (draft.issueNo) setIssueNo(draft.issueNo);
            if (draft.outDate) setOutDate(draft.outDate);
          }
        }
      } catch (e) {
        console.warn("Failed to load techpack draft from DB", e);
      } finally {
        setDraftLoaded(true);
      }
    })();
  }, [brandId, editIdFromUrl, draftLoaded]);

  // 2. Save draft to DB (autosave with debounce)
  useEffect(() => {
    if (editIdFromUrl || justCompleted || !draftLoaded) return;
    const timer = setTimeout(() => {
      const draft = {
        season, designName, fabric, fabricOther, printType,
        careInstructions, madeIn, designerName, manufacturer,
        sizes, labels, colorSwatches, uploadedMockupUrl,
        uploadedBackUrl, dimensionsBySize, mockupType, category,
        issueNo, outDate
      };
      fetch('/api/launch-map/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, draft })
      }).catch(e => console.warn("Failed to save draft to DB", e));
    }, 3000); // 3 seconds debounce for DB
    return () => clearTimeout(timer);
  }, [
    brandId, editIdFromUrl, justCompleted, draftLoaded, season, designName, fabric,
    fabricOther, printType, careInstructions, madeIn, designerName, manufacturer,
    sizes, labels, colorSwatches, uploadedMockupUrl,
    uploadedBackUrl, dimensionsBySize, mockupType, category, issueNo, outDate
  ]);

  // 3. Cleanup draft on success
  useEffect(() => {
    if (justCompleted && !editIdFromUrl) {
      fetch('/api/launch-map/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, draft: null })
      }).catch(() => { });
    }
  }, [justCompleted, editIdFromUrl, brandId]);

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
      <div className="w-full space-y-12">
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
                <Button
                  onClick={onComplete}
                  className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-lg bg-[#007AFF] text-white hover:bg-[#0056CC]"
                >
                  Continuer vers le Sourcing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[400px] lg:h-[calc(100vh-140px)] lg:flex lg:flex-col lg:overflow-hidden relative bg-white border border-black/[0.06] rounded-[28px] sm:rounded-[32px] shadow-apple overflow-hidden">
      {/* Mobile Tab Switcher — pill style */}
      <div className="lg:hidden sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-black/[0.06] px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-black text-[#86868B] uppercase tracking-widest">Tech Pack</p>
        <div className="flex p-1 gap-1 bg-[#F5F5F7] rounded-xl">
          <button
            onClick={() => setMobileTab('form')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all",
              mobileTab === 'form'
                ? "bg-white text-[#1D1D1F] shadow-sm"
                : "text-[#86868B] hover:text-[#1D1D1F]"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Formulaire
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all",
              mobileTab === 'preview'
                ? "bg-white text-[#1D1D1F] shadow-sm"
                : "text-[#86868B] hover:text-[#1D1D1F]"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Aperçu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(420px,560px)_1fr] gap-0 xl:flex-1 xl:min-h-0 xl:overflow-hidden">
        <div className={cn(
          "border-b xl:border-b-0 xl:border-r border-border overflow-y-auto p-4 xl:p-8 space-y-8 bg-white xl:min-h-0",
          mobileTab !== 'form' && "hidden xl:block"
        )}>
          {!standalone && (
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/launch-map"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Retour
              </Link>
            </div>
          )}
          {!standalone && (
            <div>
              <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight mb-1">{isEditMode ? 'Modifier le tech pack' : 'Remplir le tech pack'}</h2>
              <p className="text-sm text-[#86868B]">
                {isEditMode ? 'Modifiez les champs ci-dessous.' : 'Configurez les détails techniques de votre produit.'}
              </p>
            </div>
          )}
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
              <CardContent className="pt-0 space-y-6">
                <CardDescription>Sélectionnez un design Pharrell ou importez votre propre mockup.</CardDescription>

                {/* Design Picker */}
                {designs.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#86868B] ml-1">Tes Designs Récents</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {designs.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setSelectedDesignId(d.id);
                            setDesignLoaded(false); // Trigger reload
                          }}
                          className={cn(
                            "aspect-square rounded-xl border-2 transition-all p-2 bg-muted/30 group relative",
                            selectedDesignId === d.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <img src={d.productImageUrl} className="w-full h-full object-contain mix-blend-multiply" />
                          {selectedDesignId === d.id && (
                            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 shadow-sm">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/5" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black text-black/20"><span className="bg-white px-4">OU</span></div>
                </div>

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
                  <p className="text-xs text-muted-foreground -mt-1">Configurez chaque logo : son emplacement sur le vêtement, son image et ses dimensions.</p>
                  {labels.map((lb, idx) => (
                    <div key={`${lb.letter}-${idx}`} className="border-2 rounded-xl p-3 space-y-3 bg-white">
                      {/* En-tête du label */}
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">{lb.letter}</span>
                        <input
                          type="text"
                          value={lb.type}
                          onChange={(e) => setLabels((prev) => prev.map((l, i) => i === idx ? { ...l, type: e.target.value } : l))}
                          className="flex-1 text-xs font-semibold border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5"
                          placeholder="Nom du logo (ex: Logo poitrine)"
                        />
                        <input type="file" accept="image/*" className="hidden" id={`label-${idx}`} onChange={(e) => idx === 0 ? handleLogoUpload(e, 'frontDesign') : handleLogoUpload(e, 'label', idx)} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => document.getElementById(`label-${idx}`)?.click()} disabled={uploadingLogo === (idx === 0 ? 'frontDesign' : `label-${idx}`)} className="h-7 text-[10px] px-2 border shrink-0">
                          {lb.imageUrl ? 'Changer' : '+ Logo'}
                        </Button>
                        {lb.imageUrl && <img src={lb.imageUrl} alt="" className="h-7 w-7 object-contain border rounded-lg shrink-0" />}
                        {labels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLabels((prev) => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, letter: String.fromCharCode(65 + i) })))}
                            className="text-muted-foreground hover:text-red-500 text-sm transition-colors shrink-0 ml-1"
                            title="Supprimer cet emplacement"
                          >✕</button>
                        )}
                      </div>
                      {/* Emplacement + Dimensions */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-3 sm:col-span-1">
                          <Label className="text-[10px] text-[#8E8E93] font-bold uppercase mb-1 block">Emplacement</Label>
                          <select value={lb.placement} onChange={(e) => setLabels((prev) => prev.map((l, i) => (i === idx ? { ...l, placement: e.target.value } : l)))} className="w-full rounded-lg border border-input bg-background px-2 py-1 text-[16px] h-8 focus:ring-1 focus:ring-primary">
                            {placementOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[10px] text-[#8E8E93] font-bold uppercase mb-1 block">Largeur (in)</Label>
                          <Input type="number" step={0.5} value={lb.widthIn} onChange={(e) => setLabels((prev) => prev.map((l, i) => (i === idx ? { ...l, widthIn: parseFloat(e.target.value) || 0 } : l)))} className="h-8 text-[16px] px-2 rounded-lg" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-[#8E8E93] font-bold uppercase mb-1 block">Hauteur (in)</Label>
                          <Input type="number" step={0.5} value={lb.heightIn} onChange={(e) => setLabels((prev) => prev.map((l, i) => (i === idx ? { ...l, heightIn: parseFloat(e.target.value) || 0 } : l)))} className="h-8 text-[16px] px-2 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="w-full text-xs h-9 border-dashed" onClick={() => setLabels((prev) => [...prev, { letter: String.fromCharCode(65 + prev.length), imageUrl: null, widthIn: 14, heightIn: 8, placement: placementOptions[0] || 'Poitrine (centre)', type: `Logo ${String.fromCharCode(65 + prev.length)}` }])}>
                    + Ajouter un emplacement de logo
                  </Button>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-sm font-semibold text-primary">Impression & Détails</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Type d&apos;impression</Label>
                      <select value={printType} onChange={(e) => setPrintType(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm h-9">
                        {PRINT_TYPE_OPTIONS.map((opt) => <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>N° d&apos;issue</Label>
                      <Input placeholder="ex. 001" value={issueNo} onChange={(e) => setIssueNo(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <Label>Date de sortie</Label>
                      <Input type="date" value={outDate} onChange={(e) => setOutDate(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <Label>Fabriqué en</Label>
                      <Input placeholder="ex. Portugal" value={madeIn} onChange={(e) => setMadeIn(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-sm font-semibold text-primary">Designer</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Nom du designer</Label>
                      <Input placeholder="ex. BIANGORY STUDIO" value={designerName} onChange={(e) => setDesignerName(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <Label>Fabricant / Marque</Label>
                      <Input placeholder="ex. Voltrix" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-sm font-semibold text-primary">Tailles disponibles</h4>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all",
                          sizes.includes(s) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-sm font-semibold text-primary">Nuancier de couleurs</h4>
                  <div className="flex flex-wrap gap-3 items-center">
                    {colorSwatches.map((swatch, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={swatch.hex}
                          onChange={(e) => setColorSwatches((prev) => prev.map((s, j) => j === i ? { hex: e.target.value } : s))}
                          className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer p-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => setColorSwatches((prev) => prev.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-red-500 text-xs transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setColorSwatches((prev) => [...prev, { hex: '#000000' }])}
                      className="px-3 py-1.5 rounded-lg border-2 border-dashed border-border text-xs font-bold hover:border-primary/50 transition-all"
                    >
                      + Couleur
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-sm font-semibold text-primary">Instructions d&apos;entretien</h4>
                  <Textarea
                    value={careInstructions}
                    onChange={(e) => setCareInstructions(e.target.value)}
                    rows={4}
                    className="text-xs font-mono"
                    placeholder="MACHINE WASH COLD..."
                  />
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
                variant="outline"
                onClick={() => setShowFullPreview(true)}
                className="gap-2 sm:w-auto w-full"
              >
                <Eye className="w-4 h-4" />
                Aperçu de la fiche
              </Button>
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
      {/* Full Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl relative overflow-hidden flex flex-col h-full">
            <div className="h-14 border-b px-6 flex items-center justify-between shrink-0 bg-[#1D1D1F] text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="font-bold text-sm tracking-tight uppercase">Aperçu du Tech Pack</span>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowFullPreview(false)}
                className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-8 bg-[#F5F5F7] stylish-scrollbar">
              <div className="max-w-4xl mx-auto shadow-2xl bg-white">
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
            <div className="h-16 border-t px-6 flex items-center justify-end shrink-0 bg-white">
              <Button onClick={() => setShowFullPreview(false)} className="rounded-full px-8 bg-[#1D1D1F] text-white">Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
