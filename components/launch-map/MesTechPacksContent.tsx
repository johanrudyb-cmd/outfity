'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Download,
  Pencil,
  Send,
  Loader2,
  FolderOpen,
  FolderPlus,
  Trash2,
} from 'lucide-react';
import { PhaseTechPack } from './PhaseTechPack';
import { TechPackSheet } from '@/components/design-studio/TechPackSheet';
import type { BrandIdentity } from './LaunchMapStepper';

interface Design {
  id: string;
  type: string;
  cut?: string | null;
  material?: string | null;
  productImageUrl: string | null;
  flatSketchUrl: string | null;
  createdAt?: string;
  updatedAt: string;
  techPack: unknown;
  mockupSpec?: unknown;
  brand: { name: string | null; logo?: string | null };
  collection?: { id: string; name: string } | null;
}

interface MesTechPacksContentProps {
  brandId: string;
  brandName: string | null;
  brand?: BrandIdentity | null;
}

function groupByCollection(designs: Design[]): { collectionId: string | null; collectionName: string; designs: Design[] }[] {
  const groups = new Map<string, { collectionId: string | null; collectionName: string; designs: Design[] }>();
  for (const d of designs) {
    const key = d.collection?.id ?? '__SANS_COLLECTION__';
    const collectionName = d.collection?.name ?? 'Sans collection';
    const collectionId = d.collection?.id ?? null;
    if (!groups.has(key)) groups.set(key, { collectionId, collectionName, designs: [] });
    groups.get(key)!.designs.push(d);
  }
  const result: { collectionId: string | null; collectionName: string; designs: Design[] }[] = [];
  const sansCollection = groups.get('__SANS_COLLECTION__');
  if (sansCollection) {
    result.push(sansCollection);
    groups.delete('__SANS_COLLECTION__');
  }
  const sorted = Array.from(groups.values()).sort((a, b) => a.collectionName.localeCompare(b.collectionName));
  result.push(...sorted);
  return result;
}

interface Collection {
  id: string;
  name: string;
  _count?: { designs: number };
}

function MesTechPacksContentInner({ brandId, brandName, brand }: MesTechPacksContentProps) {
  const searchParams = useSearchParams();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [assigningCollectionId, setAssigningCollectionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [sendModal, setSendModal] = useState<Design | null>(null);
  const [downloadDesignToCapture, setDownloadDesignToCapture] = useState<Design | null>(null);
  const downloadCaptureRef = useRef<HTMLDivElement>(null);
  const [favoriteFactories, setFavoriteFactories] = useState<{ id: string; name: string; contactEmail: string | null }[]>([]);

  const fetchDesigns = useCallback(async () => {
    try {
      const res = await fetch(`/api/designs/tech-packs?brandId=${encodeURIComponent(brandId)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDesigns(data.designs ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections?brandId=${encodeURIComponent(brandId)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections ?? []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [brandId]);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}/favorite-factories`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFavoriteFactories((data.factories ?? []).map((f: { id: string; name: string; contactEmail?: string | null }) => ({
          id: f.id,
          name: f.name,
          contactEmail: f.contactEmail ?? null,
        })));
      }
    } catch (e) {
      console.error(e);
    }
  }, [brandId]);

  useEffect(() => {
    fetchDesigns();
    fetchCollections();
    fetchFavorites();
  }, [fetchDesigns, fetchCollections, fetchFavorites]);

  const handleTechPackSaved = useCallback(() => {
    fetchDesigns();
    fetchCollections();
    setFormKey((k) => k + 1);
  }, [fetchDesigns, fetchCollections]);

  const handleAssignCollection = async (designId: string, collectionId: string | null) => {
    setAssigningCollectionId(designId);
    try {
      const res = await fetch(`/api/designs/${designId}/assign-collection`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId }),
      });
      if (res.ok) fetchDesigns();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de l\'assignation');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    } finally {
      setAssigningCollectionId(null);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, name: newCollectionName.trim() }),
      });
      if (res.ok) {
        fetchCollections();
        setNewCollectionName('');
        setShowNewCollectionInput(false);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la création');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    }
  };

  const handleDownload = (design: Design) => {
    setDownloadingId(design.id);
    setDownloadDesignToCapture(design);
  };

  useEffect(() => {
    if (!downloadDesignToCapture || !downloadCaptureRef.current) return;
    const t = setTimeout(async () => {
      try {
        const canvas = await html2canvas(downloadCaptureRef.current!, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        const link = document.createElement('a');
        const safeType = (downloadDesignToCapture.type || 'design').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        link.download = `tech-pack-${safeType}-${downloadDesignToCapture.id.slice(-6)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
        console.error(e);
      } finally {
        setDownloadDesignToCapture(null);
        setDownloadingId(null);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [downloadDesignToCapture]);

  const handleModify = (design: Design) => {
    window.location.href = `/launch-map/tech-packs?edit=${design.id}`;
  };

  const handleDelete = async (design: Design) => {
    if (!window.confirm(`Supprimer le tech pack « ${(design.techPack as { speedDemon?: { designName?: string } })?.speedDemon?.designName || design.type} » ? Cette action est irréversible.`)) return;
    setDeletingId(design.id);
    try {
      const res = await fetch(`/api/designs/${design.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        fetchDesigns();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    } finally {
      setDeletingId(null);
    }
  };

  const designLabel = (d: Design) => (d.techPack as { speedDemon?: { designName?: string } })?.speedDemon?.designName || d.type || 'design';

  const handleSendToSupplier = (design: Design) => {
    const withEmail = favoriteFactories.filter((f) => f.contactEmail?.trim());
    if (withEmail.length === 0) {
      alert('Aucun fournisseur favori avec adresse email. Ajoutez un fournisseur en favori dans l\'onglet Sourcing avec son email pour envoyer directement le tech pack.');
      return;
    }
    if (withEmail.length === 1) {
      openMailto(design, withEmail[0].contactEmail!);
      return;
    }
    setSendModal(design);
  };

  const openMailto = (design: Design, email: string) => {
    const label = designLabel(design);
    const subject = encodeURIComponent(`Tech pack ${label} - ${brandName || 'Ma marque'}`);
    const link = typeof window !== 'undefined' ? `${window.location.origin}/designs/${design.id}/tech-pack` : '';
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Je vous envoie le tech pack pour le produit : ${label}.\n\n` +
      `Lien vers le tech pack : ${link}\n\n` +
      `Conseils :\n` +
      `• Téléchargez le PDF depuis "Mes tech packs" et joignez-le à votre email pour plus de détails.\n` +
      `• Indiquez les quantités par taille et la date de livraison souhaitée.\n` +
      `• N'hésitez pas à me contacter pour toute question.\n\n` +
      `Cordialement`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="w-full space-y-12">
      {/* Tech pack caché pour capture PNG directe (pas de navigation) */}
      {downloadDesignToCapture && (
        <div
          ref={downloadCaptureRef}
          className="fixed left-[-9999px] top-0 z-[-1] w-[1280px] bg-white"
          aria-hidden
        >
          <TechPackSheet
            design={{
              ...downloadDesignToCapture,
              cut: downloadDesignToCapture.cut ?? null,
              material: downloadDesignToCapture.material ?? null,
              createdAt: downloadDesignToCapture.createdAt ?? downloadDesignToCapture.updatedAt ?? new Date().toISOString(),
              updatedAt: downloadDesignToCapture.updatedAt,
              mockupSpec: downloadDesignToCapture.mockupSpec ?? {},
              brand: downloadDesignToCapture.brand,
            }}
          />
        </div>
      )}

      {/* Outil vierge prêt à compléter — visible dès la première ouverture */}
      <div className="w-full py-2">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tight">Créer un nouveau tech pack</h2>
          <p className="text-[15px] text-[#86868B] mt-2">
            Remplissez le formulaire ci-dessous pour créer une fiche technique. Une fois validé, il apparaîtra dans la liste détaillée.
          </p>
        </div>
        <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center text-muted-foreground">Chargement...</div>}>
          <PhaseTechPack
            key={`${formKey}-${searchParams.get('edit') ?? 'new'}`}
            brandId={brandId}
            brand={brand ?? null}
            onComplete={handleTechPackSaved}
            standalone
          />
        </Suspense>
      </div>

      {/* Tech packs enregistrés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Tech packs enregistrés
          </CardTitle>
          <CardDescription>
            Consultez vos fiches techniques. Téléchargez en PDF, modifiez ou envoyez directement à un fournisseur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aucun tech pack enregistré pour l&apos;instant.</p>
              <p className="text-xs mt-1">Utilisez le formulaire ci-dessus pour en créer un.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupByCollection(designs).map(({ collectionId, collectionName, designs: groupDesigns }) => (
                <div key={collectionId ?? '__sans__'} className="border rounded-lg p-4 bg-muted/20">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    {collectionName}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {groupDesigns.map((design) => {
                      const imageUrl = design.productImageUrl || design.flatSketchUrl;
                      const designName = (design.techPack as { speedDemon?: { designName?: string } })?.speedDemon?.designName || design.type;
                      return (
                        <Card key={design.id} className="overflow-hidden">
                          <div className="flex">
                            <div className="w-24 h-24 flex-shrink-0 bg-muted flex items-center justify-center">
                              {imageUrl ? (
                                <Image src={imageUrl} alt="" width={96} height={96} className="object-cover w-full h-full" unoptimized />
                              ) : (
                                <FileText className="w-10 h-10 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex-1 p-4 min-w-0">
                              <h4 className="font-semibold truncate">{designName || design.type || 'Tech pack'}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Modifié le {new Date(design.updatedAt).toLocaleDateString('fr-FR')}
                              </p>
                              <div className="mt-2">
                                <label className="text-xs text-muted-foreground block mb-1">Collection</label>
                                <select
                                  value={design.collection?.id ?? ''}
                                  onChange={(e) => handleAssignCollection(design.id, e.target.value || null)}
                                  disabled={assigningCollectionId === design.id}
                                  className="w-full text-sm rounded-md border border-input bg-background px-2 py-1"
                                >
                                  <option value="">Sans collection</option>
                                  {collections.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleDownload(design)}
                                  disabled={downloadingId === design.id}
                                >
                                  {downloadingId === design.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                  Télécharger
                                </Button>
                                <Button variant="outline" size="sm" className="gap-1" onClick={() => handleModify(design)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(design)}
                                  disabled={deletingId === design.id}
                                >
                                  {deletingId === design.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Dossiers (collections)</h4>
            <div className="flex flex-wrap gap-2 items-center">
              {collections.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-muted text-sm">
                  <FolderOpen className="w-4 h-4" />
                  {c.name}
                  {c._count?.designs != null && <span className="text-muted-foreground">({c._count.designs})</span>}
                </span>
              ))}
              {showNewCollectionInput ? (
                <div className="flex gap-2">
                  <Input placeholder="Nom du dossier" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} className="w-40 h-8 text-sm" autoFocus />
                  <Button size="sm" onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>Créer</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewCollectionInput(false); setNewCollectionName(''); }}>Annuler</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowNewCollectionInput(true)}>
                  <FolderPlus className="w-4 h-4" />
                  Nouveau dossier
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setSendModal(null)}>
          <div
            className="bg-background rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">Choisir le fournisseur favori</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sélectionnez le fournisseur auquel envoyer le tech pack. Un email sera préparé avec le lien et des conseils.
            </p>
            <div className="space-y-2 mb-4">
              {favoriteFactories.filter((f) => f.contactEmail?.trim()).map((f) => (
                <Button
                  key={f.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    openMailto(sendModal, f.contactEmail!);
                    setSendModal(null);
                  }}
                >
                  <Send className="w-4 h-4" />
                  {f.name} — {f.contactEmail}
                </Button>
              ))}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setSendModal(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MesTechPacksContent(props: MesTechPacksContentProps) {
  return (
    <Suspense fallback={<div className="p-6 min-h-[400px] flex items-center justify-center text-muted-foreground">Chargement...</div>}>
      <MesTechPacksContentInner {...props} />
    </Suspense>
  );
}
