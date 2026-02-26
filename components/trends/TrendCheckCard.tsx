'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, TrendingUp, X } from 'lucide-react';
import { ConfirmGenerateModal } from '@/components/ui/confirm-generate-modal';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { useQuota } from '@/lib/hooks/useQuota';
import { FeatureUsageBadge } from '@/components/usage/FeatureUsageBadge';
import { useSession } from 'next-auth/react';
import { isFreePlan } from '@/lib/plan-utils';

interface TrendCheckCardProps {
  /** Afficher sur toute la largeur (ex. page détail produit) */
  fullWidth?: boolean;
}

export function TrendCheckCard({ fullWidth }: TrendCheckCardProps = {}) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    matchInZones: string[];
    analysis?: { cut: string; productSignature: string };
    message: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showConfirmAnalyze, setShowConfirmAnalyze] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const isFree = isFreePlan((session?.user as any)?.plan);
  const trendsCheckQuota = useQuota('trends_check_image');

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    setShowPopup(false);
    try {
      const form = new FormData();
      form.append('image', uploadFile);
      const res = await fetch('/api/trends/check-trend-image', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        const result = {
          matchInZones: data.matchInZones || [],
          analysis: data.analysis,
          message: data.message || '',
        };
        setUploadResult(result);
        setShowPopup(true);
      } else {
        const result = { matchInZones: [] as string[], message: data.error || 'Erreur' };
        setUploadResult(result);
        setShowPopup(true);
      }
    } catch (e) {
      const result = {
        matchInZones: [] as string[],
        message: e instanceof Error ? e.message : 'Erreur',
      };
      setUploadResult(result);
      setShowPopup(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      setUploadFile(file);
      setUploadResult(null);
      setShowPopup(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      <GenerationLoadingPopup
        open={uploading}
        title="Vérification tendance en cours…"
        messages={[
          "Scan des bases de données mondiales...",
          "Analyse de la récurrence visuelle...",
          "Comparaison avec les collections leaders...",
          "Calcul du score de viralité potentielle...",
          "Détection des signaux faibles par zone...",
        ]}
      />
      <Card className={`border-2 w-full overflow-hidden ${fullWidth ? 'max-w-none' : 'max-w-2xl'}`}>
        <CardContent className="p-0">
          <div
            className={`relative flex flex-col items-center justify-center p-12 min-h-[320px] transition-colors ${uploadFile && !showPopup ? 'bg-primary/5' : 'bg-muted/20 hover:bg-muted/30'
              }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setUploadFile(e.target.files?.[0] ?? null);
                setUploadResult(null);
                setShowPopup(false);
              }}
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
              <Upload className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Est-ce une tendance ?</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Glissez une image produit ou cliquez pour sélectionner. Le système indique si c&apos;est une tendance (Europe, USA, Asie).
            </p>
            <div className="flex flex-col items-center gap-4">
              <FeatureUsageBadge featureKey="trends_check_image" isFree={isFree} />
              <div className="flex flex-wrap gap-3 items-center justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploadFile ? uploadFile.name : 'Choisir une image'}
                </Button>
                <Button
                  onClick={() => setShowConfirmAnalyze(true)}
                  disabled={!uploadFile || uploading || trendsCheckQuota?.isExhausted}
                  size="lg"
                  className="gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  {uploading ? 'Analyse…' : 'Analyser'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmGenerateModal
        open={showConfirmAnalyze}
        onClose={() => setShowConfirmAnalyze(false)}
        onConfirm={() => { setShowConfirmAnalyze(false); handleUpload(); }}
        actionLabel="Vérifier si c'est une tendance (image)"
        remaining={trendsCheckQuota?.remaining ?? 0}
        limit={trendsCheckQuota?.limit ?? 3}
        loading={uploading}
      />

      {showPopup && uploadResult && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={closePopup}
        >
          <Card
            className="w-full max-w-md border-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Résultat de l&apos;analyse</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePopup}
                  className="shrink-0 -mr-2 -mt-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="font-semibold text-foreground mb-2">{uploadResult.message}</p>
              {uploadResult.matchInZones?.length > 0 && (
                <p className="text-primary font-medium mb-1">Zones : {uploadResult.matchInZones.join(', ')}</p>
              )}
              {uploadResult.analysis && (
                <p className="text-muted-foreground text-sm mb-6">
                  Coupe : {uploadResult.analysis.cut} · Signature : {uploadResult.analysis.productSignature}
                </p>
              )}
              <Button variant="outline" className="w-full mt-2" onClick={closePopup}>
                Fermer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
