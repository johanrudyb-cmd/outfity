'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, X } from 'lucide-react';

export function PreferencesBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkPreferences = async () => {
      try {
        const response = await fetch('/api/preferences');
        if (!response.ok) return;

        const prefs = await response.json();
        // Verifier si les preferences sont completes.
        const isComplete = Boolean(prefs.preferredCountry) && (prefs.preferredCategories?.length || 0) > 0;
        setShow(!isComplete); // Afficher si incompletes
      } catch (error) {
        console.error('Error checking preferences:', error);
      }
    };

    checkPreferences();
  }, []);

  if (!show) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Configurez vos preferences intelligentes
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personnalisez les tendances et le sourcing selon vos besoins
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings#preferences">
              <Button size="sm">Configurer</Button>
            </Link>
            <button
              onClick={() => setShow(false)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
