'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Quote {
  id: string;
  factoryId: string;
  status: string;
  factory: {
    name: string;
    country: string;
  };
  createdAt: Date;
}

interface QuoteListProps {
  quotes: Quote[];
  userPlan?: string;
}

export function QuoteList({ quotes, userPlan = 'free' }: QuoteListProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Envoyé';
      case 'responded':
        return 'Répondu';
      case 'accepted':
        return 'Accepté';
      default:
        return 'En attente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'responded':
        return 'bg-amber-100 text-amber-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-lg font-light tracking-wide">
          Mes demandes de devis ({quotes.length})
        </CardTitle>
        <CardDescription className="font-light">
          Suivez l'état de vos demandes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <p className="text-center text-stone-600 font-light py-8">
            Aucune demande de devis envoyée
          </p>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-4 border border-stone-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-stone-900">
                    {(userPlan === 'free' || userPlan === 'starter') ? `Usine Partenaire #${quote.factoryId.slice(-4).toUpperCase()}` : quote.factory.name}
                  </div>
                  <div className="text-sm text-stone-600 font-light">
                    {quote.factory.country} •{' '}
                    {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(
                    quote.status
                  )}`}
                >
                  {getStatusLabel(quote.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
