'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, StarHalf } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  photos: string[];
  verified: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface FactoryReviewsProps {
  factoryId: string;
  factoryName: string;
  currentRating?: number | null;
}

export function FactoryReviews({ factoryId, factoryName, currentRating }: FactoryReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(currentRating || null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/factories/${factoryId}/reviews`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (error) {
      console.error('Erreur chargement reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [factoryId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
        {hasHalfStar && (
          <StarHalf className="w-4 h-4 fill-primary text-primary" />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-muted-foreground" />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground font-medium text-center py-4">
            Chargement des avis...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Avis clients</CardTitle>
            <CardDescription className="font-medium">
              {totalReviews > 0 ? (
                <>
                  {averageRating && (
                    <span className="font-bold text-foreground">
                      {averageRating.toFixed(1)}/5
                    </span>
                  )}{' '}
                  ({totalReviews} avis{totalReviews > 1 ? 's' : ''})
                </>
              ) : (
                'Aucun avis pour le moment'
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des avis */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border-2 border-border rounded-lg bg-card space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-sm text-foreground">
                        {review.user.name || review.user.email.split('@')[0]}
                      </div>
                      {review.verified && (
                        <span className="px-2 py-0.5 bg-success/10 text-success text-xs font-bold rounded">
                          ✓ Vérifié
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-foreground font-medium leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.photos.map((photo, index) => (
                      <Image
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-border"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-medium text-center py-4">
            Aucun avis pour le moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
