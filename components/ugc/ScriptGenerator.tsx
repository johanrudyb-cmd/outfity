'use client';

import { useState, useEffect } from 'react';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { useQuota } from '@/lib/hooks/useQuota';
import { useSurplusModal } from '@/components/usage/SurplusModalContext';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { ConfirmGenerateModal } from '@/components/ui/confirm-generate-modal';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Loader2, Copy, Edit2, Save, X, FileText, Sparkles, FolderPlus } from 'lucide-react';
import { UGCContentHistory } from './UGCContentHistory';

interface ScriptGeneratorProps {
  brandId: string;
  brandName: string;
}

interface Script {
  id?: string;
  content: string;
  isEditing?: boolean;
}

export function ScriptGenerator({ brandId, brandName }: ScriptGeneratorProps) {
  const scriptsQuota = useQuota('ugc_scripts');
  const { toast } = useToast();
  const openSurplusModal = useSurplusModal();
  const [productDescription, setProductDescription] = useState('');
  const [count, setCount] = useState(5);
  const [tone, setTone] = useState('décontracté');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [editingScript, setEditingScript] = useState<{ id: string; content: string } | null>(null);
  // Ajouter script à un fichier (collection)
  const [addToFileScriptId, setAddToFileScriptId] = useState<string | null>(null);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [fileCollectionId, setFileCollectionId] = useState('');
  const [fileNewName, setFileNewName] = useState('');
  const [fileArticleLabel, setFileArticleLabel] = useState('');
  const [fileSaving, setFileSaving] = useState(false);
  const [fileDone, setFileDone] = useState(false);
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);

  const handleGenerate = async () => {
    if (!productDescription.trim()) {
      setError('Veuillez décrire votre produit');
      return;
    }

    setIsGenerating(true);
    setError('');
    setScripts([]);

    try {
      const response = await fetch('/api/ugc/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          brandName,
          productDescription,
          count,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      // Les scripts retournés ont maintenant des IDs
      setScripts(data.scripts.map((s: any) => ({
        id: s.id,
        content: typeof s === 'string' ? s : s.content,
      })));
      toast({
        title: 'Scripts générés !',
        message: `${data.scripts.length} scripts UGC sont prêts.`,
        type: 'success',
      });
      setShowHistory(false);
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (script: string) => {
    navigator.clipboard.writeText(script);
    toast({
      message: 'Script copié dans le presse-papier',
      type: 'info',
      duration: 2000,
    });
  };

  const handleEdit = (script: Script) => {
    if (script.id) {
      setEditingScript({ id: script.id, content: script.content });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingScript) return;

    try {
      const response = await fetch(`/api/ugc/${editingScript.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingScript.content }),
      });

      if (response.ok) {
        setScripts(scripts.map((s) =>
          s.id === editingScript.id ? { ...s, content: editingScript.content } : s
        ));
        toast({
          message: 'Modification enregistrée',
          type: 'success',
        });
        setEditingScript(null);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast({
        message: 'Erreur lors de la sauvegarde',
        type: 'error',
      });
    }
  };

  const handleSelectFromHistory = (content: any) => {
    setScripts([{ id: content.id, content: content.content }]);
    setShowHistory(false);
  };

  useEffect(() => {
    if (!addToFileScriptId || !brandId) return;
    fetch(`/api/collections?brandId=${encodeURIComponent(brandId)}`)
      .then((res) => (res.ok ? res.json() : { collections: [] }))
      .then((data) => setCollections(data.collections ?? []))
      .catch(() => setCollections([]));
  }, [addToFileScriptId, brandId]);

  const handleAddScriptToFile = async () => {
    if (!addToFileScriptId) return;
    const collectionId = fileNewName.trim() ? null : fileCollectionId;
    if (!collectionId && !fileNewName.trim()) return;
    setFileSaving(true);
    setFileDone(false);
    try {
      let targetId = collectionId;
      if (fileNewName.trim()) {
        const createRes = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId, name: fileNewName.trim() }),
        });
        if (!createRes.ok) throw new Error('Impossible de créer le fichier');
        const { collection } = await createRes.json();
        targetId = collection.id;
      }
      const res = await fetch(`/api/collections/${targetId}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ugc',
          label: fileArticleLabel.trim() || undefined,
          payload: { ugcContentId: addToFileScriptId },
        }),
      });
      if (!res.ok) throw new Error('Impossible d\'ajouter l\'article');
      setFileDone(true);
      toast({
        title: 'Ajouté au fichier',
        message: 'Le script a été ajouté avec succès.',
        type: 'success',
      });
      setFileNewName('');
      setFileArticleLabel('');
      setFileCollectionId(collections[0]?.id ?? '');
      setTimeout(() => setAddToFileScriptId(null), 1500);
    } catch (e) {
      console.error(e);
      window.alert('Erreur lors de l\'ajout au fichier.');
    } finally {
      setFileSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Historique */}
      {showHistory && (
        <UGCContentHistory
          brandId={brandId}
          contentType="script"
          onSelect={handleSelectFromHistory}
          onEdit={(content) => setEditingScript({ id: content.id, content: content.content })}
        />
      )}

      {!showHistory && (
        <>
          {/* Formulaire */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Script Generator</CardTitle>
                  <CardDescription className="font-medium">
                    Générez des scripts UGC viraux de 15 secondes pour TikTok et Instagram
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(true)}
                  className="border-2"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Historique
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Description du produit *
                </label>
                <Textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Ex: Hoodie oversized en coton 400GSM, coupe streetwear, logo brodé..."
                  className="w-full px-4 py-3 border-2 border-input rounded-lg bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px] placeholder:text-muted-foreground/60"
                  disabled={isGenerating}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Nombre de scripts
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                    disabled={isGenerating}
                    className="border-2"
                  />
                  <div className="text-xs text-muted-foreground font-medium mt-1">
                    Maximum 10 scripts par génération
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Ton du script
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-input rounded-lg bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    disabled={isGenerating}
                  >
                    <option value="décontracté">Décontracté</option>
                    <option value="professionnel">Professionnel</option>
                    <option value="streetwear">Streetwear</option>
                    <option value="luxe">Luxe</option>
                    <option value="fun">Fun & énergique</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-4 text-sm text-error bg-error/10 border-2 border-error/20 rounded-lg font-medium">
                  {error}
                </div>
              )}

              {scriptsQuota?.isExhausted ? (
                <Button
                  onClick={openSurplusModal}
                  className="w-full shadow-modern-lg bg-gradient-to-r from-primary to-primary/80"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Recharger ce module
                </Button>
              ) : (
                <>
                  {scriptsQuota?.isAlmostFinished && (
                    <div className="flex items-center justify-between gap-2 rounded-md bg-amber-500/15 px-3 py-2 text-amber-800 dark:text-amber-200 mb-3">
                      <span className="text-xs font-medium">Stock épuisé bientôt !</span>
                      <button type="button" onClick={openSurplusModal} className="text-xs font-semibold underline hover:no-underline">
                        Prendre une recharge
                      </button>
                    </div>
                  )}
                  <Button
                    onClick={() => setShowConfirmGenerate(true)}
                    disabled={isGenerating || !productDescription.trim()}
                    className="w-full shadow-modern-lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Tressage des dialogues...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Générer {count} script{count > 1 ? 's' : ''}
                        <GenerationCostBadge feature="ugc_scripts" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <GenerationLoadingPopup
            open={isGenerating}
            title="Écriture de vos scénarios viraux..."
            messages={[
              "Analyse des hooks les plus performants...",
              "Rédaction de la structure narrative...",
              "Optimisation du rythme social media...",
              "Intégration des appels à l'action...",
              "Affinage du ton de marque...",
            ]}
          />
          <ConfirmGenerateModal
            open={showConfirmGenerate}
            onClose={() => setShowConfirmGenerate(false)}
            onConfirm={() => { setShowConfirmGenerate(false); handleGenerate(); }}
            actionLabel={`Générer ${count} script${count > 1 ? 's' : ''}`}
            remaining={scriptsQuota?.remaining ?? 0}
            limit={scriptsQuota?.limit ?? 10}
            loading={isGenerating}
          />

          {/* Résultats */}
          {scripts.length > 0 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Scripts générés ({scripts.length})
                </CardTitle>
                <CardDescription className="font-medium">
                  Structure : Problème → Solution → Preuve → CTA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scripts.map((script, index) => {
                  const isEditing = editingScript?.id === script.id;
                  const displayContent = isEditing ? (editingScript?.content ?? script.content) : script.content;

                  return (
                    <div
                      key={script.id || index}
                      className="border-2 border-border rounded-xl p-5 bg-card hover:border-primary/50 transition-all"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editingScript?.content ?? ''}
                            onChange={(e) =>
                              editingScript && setEditingScript({ ...editingScript, content: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-input rounded-lg bg-background text-foreground font-medium min-h-[150px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveEdit}
                              size="sm"
                              className="shadow-modern"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Enregistrer
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingScript(null)}
                              size="sm"
                              className="border-2"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                              Script {index + 1}
                            </span>
                            <div className="flex gap-2">
                              {script.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(script)}
                                  className="border-2"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              )}
                              {script.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAddToFileScriptId(addToFileScriptId === script.id ? null : (script.id ?? null))}
                                  className="border-2"
                                  title="Ajouter à un fichier (collection)"
                                >
                                  <FolderPlus className="w-3 h-3 mr-1" />
                                  Fichier
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(script.content)}
                                className="border-2"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copier
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-foreground font-medium whitespace-pre-wrap leading-relaxed">
                            {displayContent}
                          </p>
                          {script.id && addToFileScriptId === script.id && (
                            <div className="mt-4 pt-4 border-t border-border space-y-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Ajouter ce script à un fichier (collection)</p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <select
                                  value={fileCollectionId}
                                  onChange={(e) => setFileCollectionId(e.target.value)}
                                  disabled={!!fileNewName.trim()}
                                  className="w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
                                >
                                  <option value="">— Fichier existant —</option>
                                  {collections.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                                <Input
                                  placeholder="Ou nouveau fichier"
                                  value={fileNewName}
                                  onChange={(e) => setFileNewName(e.target.value)}
                                  onFocus={() => setFileCollectionId('')}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <Input
                                placeholder="Nom de l’article (optionnel)"
                                value={fileArticleLabel}
                                onChange={(e) => setFileArticleLabel(e.target.value)}
                                className="h-9 text-sm"
                              />
                              <div className="flex gap-2 items-center">
                                <Button
                                  size="sm"
                                  onClick={handleAddScriptToFile}
                                  disabled={fileSaving || (!fileCollectionId && !fileNewName.trim())}
                                >
                                  {fileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                  {fileSaving ? 'Ajout…' : 'Ajouter au fichier'}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setAddToFileScriptId(null)}>Annuler</Button>
                                {fileDone && <span className="text-xs text-green-600">Ajouté au fichier.</span>}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )
      }
    </div>
  );
}
