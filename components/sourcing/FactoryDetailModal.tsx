'use client';

import { Button } from '@/components/ui/button';
import { X, Star, Mail, Phone, ExternalLink } from 'lucide-react';
import { isFreePlan } from '@/lib/plan-utils';

interface Factory {
  id: string;
  name: string;
  country: string;
  moq: number;
  specialties: string[];
  leadTime: number;
  certifications: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  website?: string | null;
  rating: number | null;
}

interface FactoryDetailModalProps {
  factory: Factory;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  userPlan?: string;
}

export function FactoryDetailModal({
  factory,
  isFavorite,
  onToggleFavorite,
  onClose,
  userPlan = 'starter',
}: FactoryDetailModalProps) {

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
        <div className="bg-background rounded-xl shadow-modern-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
          <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-foreground truncate pr-4">
              {isFreePlan(userPlan) ? `Usine Partenaire #${factory.id.slice(-4).toUpperCase()}` : factory.name}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onToggleFavorite}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title={isFavorite ? 'Retirer des favoris' : 'Mettre en favori'}
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-muted-foreground">{factory.country}</p>
              {factory.rating != null && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="text-sm font-medium">{factory.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {factory.specialties.length > 0 && (
              <div>
                <p className="text-muted-foreground font-medium text-sm mb-2">Spécialités</p>
                <div className="flex flex-wrap gap-2">
                  {factory.specialties.map((s, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded font-medium border border-primary/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {factory.certifications.length > 0 && (
              <div>
                <p className="text-muted-foreground font-medium text-sm mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {factory.certifications.map((c, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-success/10 text-success rounded font-medium border border-success/20">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(factory.contactEmail || factory.contactPhone) && (
              <div>
                <p className="text-muted-foreground font-medium text-sm mb-2">Coordonnées</p>
                {isFreePlan(userPlan) ? (
                  <div className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-4 flex flex-col items-center text-center gap-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-tight">🔒 Contenu Réservé</p>
                    <p className="text-xs text-muted-foreground">Les coordonnées directes des usines sont réservées aux membres Créateur.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 h-8 text-[11px]"
                      onClick={() => window.location.href = '/auth/choose-plan'}
                    >
                      Débloquer le Sourcing Hub
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {factory.contactEmail && (
                      <a
                        href={`mailto:${factory.contactEmail}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Mail className="w-4 h-4" />
                        {factory.contactEmail}
                      </a>
                    )}
                    {factory.contactPhone && (
                      <a
                        href={`tel:${factory.contactPhone}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {factory.contactPhone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {factory.website && (
              <div className="flex gap-2 pt-2 border-t border-border">
                {isFreePlan(userPlan) ? (
                  <Button
                    className="flex-1 gap-2 grayscale-[0.5] opacity-80"
                    variant="secondary"
                    onClick={() => window.location.href = '/auth/choose-plan'}
                  >
                    <span>🔒 Voir le site web (Plan Créateur)</span>
                  </Button>
                ) : (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => window.open(factory.website!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir le site web
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
