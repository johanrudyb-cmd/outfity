'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Mail } from 'lucide-react';
import { buildQuoteEmail, isForeignSupplier } from '@/lib/quote-email-template';

interface Design {
  id: string;
  type: string;
  cut?: string | null;
  material?: string | null;
  collection?: { id: string; name: string } | null;
  brand?: { name: string | null } | null;
}

interface Factory {
  id: string;
  name: string;
  country: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

interface RequestQuoteModalProps {
  factory: Factory;
  brandId: string;
  onClose: () => void;
  onSuccess: () => void;
  preFilledMessage?: string;
  preFilledSubject?: string;
}

export function RequestQuoteModal({
  factory,
  brandId,
  onClose,
  onSuccess,
  preFilledMessage,
  preFilledSubject,
}: RequestQuoteModalProps) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string>('');
  const [subject, setSubject] = useState(preFilledSubject || '');
  const [message, setMessage] = useState(preFilledMessage || '');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/designs/tech-packs?brandId=${encodeURIComponent(brandId)}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.resolve({ designs: [] }))
      .then((data) => {
        const list = data.designs ?? [];
        setDesigns(list);
        if (list.length > 0 && !selectedDesignId) {
          setSelectedDesignId(list[0].id);
        }
      })
      .catch(() => setDesigns([]));
  }, [brandId, selectedDesignId]);

  useEffect(() => {
    if (preFilledMessage) setMessage(preFilledMessage);
    if (preFilledSubject) setSubject(preFilledSubject);
  }, [preFilledMessage, preFilledSubject]);

  const handlePrepare = () => {
    if (!selectedDesignId) {
      setError('Veuillez sélectionner un tech pack.');
      return;
    }
    setError('');
    const design = designs.find((d) => d.id === selectedDesignId);
    if (!design) return;
    const useEnglish = isForeignSupplier(factory.country);
    const { subject: subj, body } = buildQuoteEmail({
      type: design.type,
      cut: design.cut,
      material: design.material,
      factoryName: factory.name,
      brandName: design.brand?.name ?? undefined,
      useEnglish,
    });
    setSubject(subj);
    setMessage(body);
  };

  const handleValidate = async () => {
    if (!factory.contactEmail) {
      setError('Aucune adresse email pour ce fournisseur.');
      return;
    }
    const subj = subject || 'Demande de devis';
    const body = message || '';

    if (selectedDesignId) {
      try {
        const res = await fetch('/api/quotes/send-with-attachment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designId: selectedDesignId,
            factoryId: factory.id,
            brandId,
            subject: subj,
            body,
          }),
          credentials: 'include',
        });
        const data = await res.json();

        if (res.ok) {
          onSuccess();
          return;
        }

        if (res.status === 503 && data.error?.includes('SMTP')) {
          // Fallback mailto + téléchargement PDF
          window.open(`/api/designs/${selectedDesignId}/export-pdf`, '_blank');
          const url = `mailto:${factory.contactEmail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body + '\n\n---\nPJ : tech-pack (fichier téléchargé — à joindre manuellement)')}`;
          window.open(url);
          onSuccess();
          return;
        }

        throw new Error(data.error || 'Erreur lors de l\'envoi');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
        return;
      }
    }

    const url = `mailto:${factory.contactEmail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    window.open(url);
    onSuccess();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    alert('Message copié dans le presse-papier !');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
      <Card className="w-full max-w-md border-stone-200 bg-background shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-light tracking-wide">
            Demander un devis
          </CardTitle>
          <CardDescription className="font-light">
            {factory.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Tech pack
              </label>
              <select
                value={selectedDesignId}
                onChange={(e) => setSelectedDesignId(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">— Choisir un tech pack —</option>
                {designs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.type}
                    {d.cut ? ` - ${d.cut}` : ''}
                    {d.collection?.name ? ` (${d.collection.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Sujet
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet de l'email"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Message pour le fournisseur
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Sélectionnez un tech pack, cliquez sur Préparer le mail, puis Valider pour ouvrir votre messagerie."
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[180px]"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrepare}
                disabled={!selectedDesignId}
              >
                Préparer le mail
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!message}
                className="gap-1"
              >
                <Copy className="w-4 h-4" />
                Copier
              </Button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-stone-300 text-stone-700 font-light tracking-wide uppercase text-xs py-2"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleValidate}
                disabled={!factory.contactEmail || !message}
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-light tracking-wide uppercase text-xs py-2 gap-2"
              >
                <Mail className="w-4 h-4" />
                Valider
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
