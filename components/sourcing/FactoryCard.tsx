'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Info, ExternalLink } from 'lucide-react';
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

interface FactoryCardProps {
  factory: Factory;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onViewDetail?: () => void;
  userPlan?: string;
}

export function FactoryCard({ factory, isFavorite = false, onToggleFavorite, onViewDetail, userPlan = 'starter' }: FactoryCardProps) {

  return (
    <>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="text-lg font-semibold text-foreground flex-1 min-w-0">
                  {isFreePlan(userPlan) ? `Usine Partenaire #${factory.id.slice(-4).toUpperCase()}` : factory.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={onToggleFavorite}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title={isFavorite ? 'Retirer des favoris' : 'Mettre en favori (visible dans Gérer ma marque > Sourcing)'}
                      aria-label={isFavorite ? 'Retirer des favoris' : 'Mettre en favori'}
                    >
                      <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`} />
                    </button>
                  )}
                  {factory.rating && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-warning/10 border border-warning/20">
                      <span className="text-warning">★</span>
                      <span className="text-sm font-medium text-foreground">
                        {factory.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {factory.country}
              </div>
            </div>

            {/* Spécialités */}
            <div className="border-t border-border pt-3">
              <div className="text-xs text-muted-foreground mb-2 font-medium uppercase">
                Spécialités
              </div>
              <div className="flex flex-wrap gap-2">
                {factory.specialties.slice(0, 3).map((specialty, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded font-medium border border-primary/20"
                  >
                    {specialty}
                  </span>
                ))}
                {factory.specialties.length > 3 && (
                  <span className="px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border">
                    +{factory.specialties.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Certifications */}
            {factory.certifications.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2 font-medium uppercase">
                  Certifications
                </div>
                <div className="flex flex-wrap gap-2">
                  {factory.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-success/10 text-success rounded font-medium border border-success/20"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {onViewDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetail}
                  className="gap-1.5"
                  title="Voir le détail du fournisseur"
                >
                  <Info className="w-4 h-4" />
                  Voir le détail
                </Button>
              )}
              {factory.website && (
                isFreePlan(userPlan) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 min-w-[120px] gap-1.5 opacity-50 cursor-pointer text-muted-foreground border-dashed border-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = '/auth/choose-plan';
                    }}
                    title="Accès réservé au plan Créateur"
                  >
                    <span>🔒 Site Web (Créateur)</span>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(factory.website!, '_blank')}
                    className="flex-1 min-w-[120px] gap-1.5"
                    title="Voir le site web"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir le site web
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </>
  );
}
