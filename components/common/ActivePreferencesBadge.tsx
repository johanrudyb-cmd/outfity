'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import Link from 'next/link';

interface ActivePreferencesBadgeProps {
  type: 'trends' | 'sourcing' | 'spy';
}

export function ActivePreferencesBadge({ type }: ActivePreferencesBadgeProps) {
  const [preferences, setPreferences] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/preferences');
        if (!response.ok) return;

        const prefs = await response.json();
        setPreferences(prefs);

        // Afficher si des preferences sont actives selon le type.
        if (type === 'trends') {
          setShow((prefs.preferredCategories?.length || 0) > 0 || (prefs.preferredStyles?.length || 0) > 0);
          return;
        }

        if (type === 'sourcing') {
          setShow((prefs.preferredSourcingCountries?.length || 0) > 0 || Boolean(prefs.preferredMOQ) || Boolean(prefs.maxLeadTime));
          return;
        }

        setShow(false);
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    fetchPreferences();
  }, [type]);

  if (!show || !preferences) return null;

  const getActiveCount = () => {
    if (type === 'trends') {
      return (preferences.preferredCategories?.length || 0) + (preferences.preferredStyles?.length || 0);
    }

    if (type === 'sourcing') {
      let count = preferences.preferredSourcingCountries?.length || 0;
      if (preferences.preferredMOQ) count++;
      if (preferences.maxLeadTime) count++;
      return count;
    }

    return 0;
  };

  const activeCount = getActiveCount();

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="inline-flex items-center rounded-md px-2.5 py-1 bg-primary/5 border border-primary/20 text-primary text-xs font-medium">
        <Settings className="w-3 h-3 mr-1.5" />
        {activeCount} preference{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''}
      </div>
      <Link href="/settings#preferences" className="text-xs text-muted-foreground hover:text-primary transition-colors">
        Modifier
      </Link>
    </div>
  );
}
