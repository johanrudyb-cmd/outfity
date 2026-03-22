'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'page' | 'tool' | 'brand';
  title: string;
  description: string;
  href: string;
}

const searchableItems: SearchResult[] = [
  { type: 'page', title: 'Tableau de bord', description: 'Vue d\'ensemble de votre progression', href: '/dashboard' },
  { type: 'tool', title: 'Sourcing Hub', description: 'Trouvez des usines qualifiées', href: '/sourcing' },
  { type: 'page', title: 'Tendances de la semaine', description: 'Nouveautés chaque semaine — ne vous désabonnez pas', href: '/trends' },
  { type: 'page', title: 'Marques tendances', description: 'Les marques les plus tendances de la semaine', href: '/brands' },
  { type: 'tool', title: 'Analyse de marque & tendances', description: 'Analyse IA de marques et analyseur de tendances', href: '/brands/analyze' },
  { type: 'page', title: 'Gérer ma marque', description: 'Guide complet de lancement', href: '/launch-map' },
  { type: 'page', title: 'Paramètres', description: 'Gérez votre profil et préférences', href: '/settings' },
  { type: 'page', title: 'Notifications', description: 'Voir toutes vos notifications', href: '/notifications' },
];

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return searchableItems.filter((item) =>
      item.title.toLowerCase().includes(normalized) ||
      item.description.toLowerCase().includes(normalized)
    ).slice(0, 6);
  }, [query]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && results[focusedIndex]) {
      e.preventDefault();
      router.push(results[focusedIndex].href);
      setQuery('');
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (href: string) => {
    router.push(href);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tool':
        return 'Outil';
      case 'page':
        return 'Page';
      case 'brand':
        return 'Marque';
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 w-full max-w-lg relative" ref={searchRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQuery(nextQuery);
            setFocusedIndex(-1);
            setIsOpen(nextQuery.trim().length > 0);
          }}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-3 sm:pl-4 pr-12 sm:pr-10 py-3 text-base bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-apple focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all placeholder:text-[#1D1D1F]/40 min-h-[44px]"
        />
        {query && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 touch-target flex items-center justify-center text-[#1D1D1F]/40 hover:text-[#1D1D1F] transition-colors text-lg font-medium rounded-xl"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 sm:mt-3 w-full min-w-0 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-apple-lg z-50 max-h-[70vh] sm:max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={`${result.href}-${index}`}
              onClick={() => handleSelect(result.href)}
              className={`px-5 py-4 cursor-pointer transition-colors border-b border-black/5 last:border-b-0 first:rounded-t-3xl last:rounded-b-3xl ${
                index === focusedIndex
                  ? 'bg-black/5'
                  : 'hover:bg-black/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-[#1D1D1F]/50 uppercase tracking-wide">
                      {getTypeLabel(result.type)}
                    </span>
                    <h4 className="font-semibold text-base text-[#1D1D1F] truncate">
                      {result.title}
                    </h4>
                  </div>
                  <p className="text-sm text-[#1D1D1F]/60 line-clamp-1">
                    {result.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.trim().length > 0 && results.length === 0 && (
        <div className="absolute top-full mt-3 w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-apple-lg z-50 p-8 text-center">
          <p className="text-base text-[#1D1D1F]/60">
            Aucun résultat pour "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
