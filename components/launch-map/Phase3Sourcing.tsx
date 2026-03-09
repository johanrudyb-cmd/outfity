'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Users } from 'lucide-react';

interface SupplierItem {
  id: string;
  name: string;
  country: string;
  moq?: number;
  leadTime?: number;
  quoteCount?: number;
}

interface Phase3SourcingProps {
  brandId: string;
  brand?: any;
  onComplete: () => void;
  canComplete?: boolean;
  userPlan?: string;
}

export function Phase3Sourcing({ brandId, onComplete, canComplete = true, userPlan = 'starter' }: Phase3SourcingProps) {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [favoriteSuppliers, setFavoriteSuppliers] = useState<SupplierItem[]>([]);
  const [quoteCount, setQuoteCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [quotesRes, favRes] = await Promise.all([
          fetch(`/api/quotes?brandId=${encodeURIComponent(brandId)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }).catch((err) => {
            console.error('Erreur fetch quotes:', err);
            return { ok: false, json: async () => ({ quotes: [] }) };
          }),
          fetch(`/api/brands/${encodeURIComponent(brandId)}/favorite-factories`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }).catch((err) => {
            console.error('Erreur fetch favorite factories:', err);
            return { ok: false, json: async () => ({ factories: [] }) };
          }),
        ]);

        let quotesData = { quotes: [] };
        try {
          if (quotesRes.ok) {
            quotesData = await quotesRes.json();
          }
        } catch (err) {
          console.error('Erreur parsing quotes:', err);
        }

        const quotes = (quotesData.quotes || []) as { status: string; factory?: { id: string; name: string; country: string; moq?: number; leadTime?: number } | null }[];
        const sentQuotes = quotes.filter((q) => q.status === 'sent');
        setQuoteCount(sentQuotes.length);

        if (sentQuotes.length >= 2 && !isCompleted) {
          setIsCompleted(true);
          // Ne pas appeler onComplete automatiquement ici pour éviter les boucles
          // onComplete sera appelé manuellement par l'utilisateur ou après validation
        }

        // Récupérer les favoris d'abord
        let favData: { factories?: { id: string; name: string; country: string; moq?: number; leadTime?: number }[] } = { factories: [] };
        try {
          if (favRes.ok) {
            favData = await favRes.json();
          }
        } catch (err) {
          console.error('Erreur parsing favorite factories:', err);
        }

        const factoriesList = favData.factories || [];

        // Créer une map pour fusionner fournisseurs avec devis ET favoris
        const suppliersMap = new Map<string, SupplierItem>();

        // D'abord ajouter les fournisseurs qui ont reçu des devis
        for (const q of sentQuotes) {
          const f = q.factory;
          if (!f) continue;
          const existing = suppliersMap.get(f.id);
          if (existing) {
            existing.quoteCount = (existing.quoteCount ?? 0) + 1;
          } else {
            suppliersMap.set(f.id, {
              id: f.id,
              name: f.name,
              country: f.country,
              moq: f.moq,
              leadTime: f.leadTime,
              quoteCount: 1,
            });
          }
        }

        // Ensuite ajouter les favoris (s'ils ne sont pas déjà dans la map)
        for (const f of factoriesList) {
          const existing = suppliersMap.get(f.id);
          if (existing) {
            // Si déjà présent (a reçu un devis), on garde le quoteCount existant
            // Sinon on ne fait rien, il est déjà dans la map
          } else {
            // Ajouter le favori comme fournisseur avec qui on travaille
            suppliersMap.set(f.id, {
              id: f.id,
              name: f.name,
              country: f.country,
              moq: f.moq,
              leadTime: f.leadTime,
              quoteCount: 0,
            });
          }
        }

        // Tous les fournisseurs (devis + favoris) sont maintenant dans "Fournisseurs avec qui vous travaillez"
        setSuppliers(Array.from(suppliersMap.values()));

        // Ne plus afficher une section "Favoris" séparée
        setFavoriteSuppliers([]);
      } catch (error) {
        console.error('Erreur chargement sourcing:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000); // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const renderList = (items: SupplierItem[], title: string, icon: React.ReactNode) => (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        {icon}
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="font-medium text-foreground">{s.name}</span>
            <span className="text-muted-foreground">{s.country}</span>
            {s.moq != null && <span className="text-muted-foreground">MOQ {s.moq}</span>}
            {s.leadTime != null && <span className="text-muted-foreground">Délai {s.leadTime} j</span>}
            {(s.quoteCount ?? 0) > 0 && (
              <span className="text-primary font-medium">{s.quoteCount} devis</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#F5F5F7] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {suppliers.length > 0 ? (
            <div className="space-y-3">
              {suppliers.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-[#86868B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#1D1D1F] truncate">{s.name}</p>
                    <p className="text-[11px] text-[#86868B]">
                      {s.country}
                      {s.moq != null && ` · MOQ ${s.moq}`}
                      {s.leadTime != null && ` · ${s.leadTime}j`}
                    </p>
                  </div>
                  {(s.quoteCount ?? 0) > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-bold shrink-0">
                      {s.quoteCount} devis
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-[#F5F5F7]/60 border border-black/5">
              <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center mb-4 shadow-sm border border-black/5">
                <Truck className="w-8 h-8 text-[#C7C7CC]" />
              </div>
              <h3 className="text-base font-bold text-[#1D1D1F] mb-1">Aucun fournisseur</h3>
              <p className="text-sm text-[#86868B] max-w-[260px] leading-relaxed">
                Accédez au hub pour trouver des usines vérifiées, les mettre en favori et leur envoyer votre tech pack.
              </p>
            </div>
          )}
        </>
      )}

      {quoteCount > 0 && quoteCount < 2 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-800 font-medium">
            {quoteCount} devis envoyé sur 2 requis pour valider la phase
          </p>
        </div>
      )}

      {quoteCount >= 2 && !isCompleted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-sm">✓</div>
          <div className="flex-1">
            <p className="text-sm text-emerald-800 font-bold mb-1">Phase complétée ! {quoteCount} devis envoyés.</p>
            <button onClick={() => { setIsCompleted(true); onComplete(); }} className="text-[12px] font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2">
              Valider et continuer →
            </button>
          </div>
        </div>
      )}

      <div className="mt-2">
        <Link href="/launch-map/sourcing">
          <button className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-[#1D1D1F] hover:bg-[#3a3a3c] text-white font-bold text-sm transition-all active:scale-[0.97] shadow-sm">
            <Users className="w-4 h-4" />
            Accéder au Hub Sourcing
          </button>
        </Link>
      </div>
    </div>
  );
}
