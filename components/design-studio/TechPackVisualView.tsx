'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, ArrowLeft, Image as ImageIcon, Ruler, Package, Scissors, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { TechPackVisual } from '@/lib/mockup-and-techpack-types';
import { TechPackSheet } from './TechPackSheet';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';

interface Design {
  id: string;
  type: string;
  cut: string | null;
  material: string | null;
  productImageUrl: string | null;
  flatSketchUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
  techPack: unknown;
  mockupSpec: unknown;
  prompt: string | null;
  brand: { name: string | null; logo?: string | null };
}

interface TechPackVisualViewProps {
  design: Design;
}

export function TechPackVisualView({ design }: TechPackVisualViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const techPackRef = useRef<HTMLDivElement>(null);
  const handleDownloadRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const productImageUrl = design.productImageUrl || design.flatSketchUrl;
  const spec = design.mockupSpec as Record<string, unknown> | null;
  const techPack = design.techPack as (TechPackVisual & Record<string, unknown>) | null;

  const handleDownload = async () => {
    const el = techPackRef.current;
    if (!el) return;
    setIsDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `tech-pack-${design.type?.toLowerCase() || 'design'}-${design.id?.slice(-6) || 'export'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };
  handleDownloadRef.current = handleDownload;

  const handleDownloadPdf = async () => {
    const el = techPackRef.current;
    if (!el) return;
    setIsDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const safeType = (design.type?.toLowerCase() || 'design').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      pdf.save(`tech-pack-${safeType}-${design.id?.slice(-6) || 'export'}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleGenerateTechPack = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(`/api/designs/${design.id}/generate-tech-pack`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur génération');
      router.refresh();
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-téléchargement PNG depuis la liste (ex: /designs/[id]/tech-pack?download=png)
  useEffect(() => {
    if (searchParams.get('download') === 'png') {
      const t = setTimeout(() => {
        handleDownloadRef.current();
        window.history.replaceState({}, '', `/designs/${design.id}/tech-pack`);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [searchParams, design.id]);

  return (
    <div className="space-y-8">
      <GenerationLoadingPopup open={isGenerating} title="Génération du tech pack…" />
      <GenerationLoadingPopup open={isDownloading} title="Téléchargement de l'image…" />
      <GenerationLoadingPopup open={isDownloadingPdf} title="Téléchargement du PDF…" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/design-studio"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Design Studio
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateTechPack}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Générer le tech pack ultra détaillé
            <GenerationCostBadge feature="design_tech_pack" />
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={isDownloading} className="gap-2">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Télécharger PNG
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isDownloadingPdf} className="gap-2">
            {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Télécharger PDF
          </Button>
        </div>
      </div>
      {generateError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{generateError}</p>
      )}

      {/* Tech pack : taille adaptée au nombre de logos, mockups agrandis, téléchargeable en PNG */}
      <div className="flex justify-center">
        <div
          ref={techPackRef}
          id="tech-pack-document"
          className="w-full max-w-[1280px] shadow-2xl rounded-xl overflow-hidden border-2 border-border bg-stone-100 p-2"
        >
          <div className="w-full min-h-0 overflow-hidden rounded-lg bg-white">
            <TechPackSheet
          design={{
            ...design,
            createdAt: design.createdAt || new Date().toISOString(),
            updatedAt: design.updatedAt || new Date().toISOString(),
            brand: { name: design.brand.name, logo: design.brand.logo },
          }}
          manufacturer={(techPack as Record<string, unknown>)?.manufacturer as string | undefined}
            />
          </div>
        </div>
      </div>

      {productImageUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="w-4 h-4" />
              Photo produit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden bg-muted aspect-square max-w-md">
              <Image
                src={productImageUrl}
                alt={`${design.type} - photo produit`}
                width={1200}
                height={1200}
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="w-4 h-4" />
            Spécifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium">{design.type}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Coupe</dt>
              <dd className="font-medium">{design.cut || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Matière</dt>
              <dd className="font-medium">{design.material || '—'}</dd>
            </div>
            {Boolean(spec?.colorMain) && (
              <div>
                <dt className="text-muted-foreground">Couleur principale</dt>
                <dd className="font-medium">{String(spec?.colorMain)}</dd>
              </div>
            )}
            {Boolean(spec?.neckline) && (
              <div>
                <dt className="text-muted-foreground">Encolure</dt>
                <dd className="font-medium">{String(spec?.neckline)}</dd>
              </div>
            )}
            {Boolean(spec?.sleeves) && (
              <div>
                <dt className="text-muted-foreground">Manches</dt>
                <dd className="font-medium">{String(spec?.sleeves)}</dd>
              </div>
            )}
            {Boolean(spec?.designType && spec.designType !== 'none') && (
              <>
                <div>
                  <dt className="text-muted-foreground">Visuel</dt>
                  <dd className="font-medium">{String(spec?.designType)}</dd>
                </div>
                {Boolean(spec?.designPlacement) && (
                  <div>
                    <dt className="text-muted-foreground">Placement</dt>
                    <dd className="font-medium">{String(spec?.designPlacement)}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {techPack?.materials && techPack.materials.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4" />
              Matières et fournitures
            </CardTitle>
            <CardDescription>Tissus, compositions et références pour le fournisseur.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {techPack.materials.map((m, i) => (
                <li key={i} className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="font-medium">{m.name}</span>
                  {m.composition && <span className="text-muted-foreground">{m.composition}</span>}
                  {m.weight && <span className="text-muted-foreground">{m.weight}</span>}
                  {m.ref && <span className="text-muted-foreground">Ref. {m.ref}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {techPack?.measurementsTable && techPack.measurementsTable.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler className="w-4 h-4" />
              Tableau des mesures (cm)
            </CardTitle>
            <CardDescription>Spécifications par taille pour le fournisseur.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Taille</th>
                    {techPack.measurementsTable[0]?.measurements &&
                      Object.keys(techPack.measurementsTable[0].measurements).map((k) => (
                        <th key={k} className="text-left p-2 font-medium capitalize">
                          {k.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {techPack.measurementsTable.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2 font-medium">{row.size}</td>
                      {row.measurements &&
                        Object.values(row.measurements).map((v, j) => (
                          <td key={j} className="p-2 text-muted-foreground">
                            {typeof v === 'number' ? v : v}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {techPack?.constructionNotes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scissors className="w-4 h-4" />
              Détails de construction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{techPack.constructionNotes}</p>
          </CardContent>
        </Card>
      )}

      {techPack?.printSpec && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Impression / broderie</CardTitle>
            <CardDescription>Placement, dimensions et technique.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Placement</dt><dd className="font-medium">{techPack.printSpec.placement}</dd></div>
              <div><dt className="text-muted-foreground">Dimensions (cm)</dt><dd className="font-medium">{techPack.printSpec.width} × {techPack.printSpec.height}</dd></div>
              <div><dt className="text-muted-foreground">Technique</dt><dd className="font-medium">{techPack.printSpec.technique}</dd></div>
              {techPack.printSpec.colors?.length > 0 && (
                <div><dt className="text-muted-foreground">Couleurs</dt><dd className="font-medium">{techPack.printSpec.colors.join(', ')}</dd></div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {techPack?.trims && techPack.trims.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fournitures (boutons, fermetures, etc.)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {techPack.trims.map((t, i) => (
                <li key={i} className="flex flex-wrap gap-x-3 rounded bg-muted/50 p-2">
                  <span className="font-medium">{t.name}</span>
                  {t.placement && <span className="text-muted-foreground">{t.placement}</span>}
                  {t.ref && <span className="text-muted-foreground">Ref. {t.ref}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(techPack?.labeling || techPack?.packaging || techPack?.compliance) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Étiquetage, packaging et conformité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {techPack.labeling && (
              <div>
                <dt className="text-muted-foreground font-medium mb-1">Étiquetage</dt>
                <dd className="text-muted-foreground whitespace-pre-wrap">{techPack.labeling}</dd>
              </div>
            )}
            {techPack.packaging && (
              <div>
                <dt className="text-muted-foreground font-medium mb-1">Packaging</dt>
                <dd className="text-muted-foreground whitespace-pre-wrap">{techPack.packaging}</dd>
              </div>
            )}
            {techPack.compliance && (
              <div>
                <dt className="text-muted-foreground font-medium mb-1">Conformité</dt>
                <dd className="text-muted-foreground whitespace-pre-wrap">{techPack.compliance}</dd>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(!techPack || Object.keys(techPack).length === 0 || (!techPack.materials?.length && !techPack.measurementsTable?.length && !(techPack as Record<string, unknown>)?.speedDemon)) && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Générez un tech pack ultra détaillé (matières, tableau des mesures, construction, impression, étiquetage) avec l&apos;IA.</p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={handleGenerateTechPack} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Générer le tech pack ultra détaillé
              <GenerationCostBadge feature="design_tech_pack" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Link href="/design-studio" className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-lg border border-border hover:bg-muted">
          Retour aux designs
        </Link>
      </div>
    </div>
  );
}
