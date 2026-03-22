'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Cache simple pour les requêtes API
 * Évite les requêtes répétées pour les mêmes données
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 30000; // 30 secondes par défaut

  /**
   * Récupère une valeur du cache si elle existe et n'est pas expirée
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Instance globale du cache
export const requestCache = new RequestCache();

// Nettoyer le cache toutes les minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup();
  }, 60000);
}

/**
 * Hook pour utiliser le cache avec fetch
 */
export function useCachedFetch<T>(
  url: string | null,
  options?: RequestInit & { cacheTTL?: number }
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = url || '';
  const cacheTTL = options?.cacheTTL || 30000;

  const fetchData = useCallback(async () => {
    if (!url) {
      setData(null);
      return;
    }

    // Vérifier le cache d'abord
    const cached = requestCache.get<T>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      
      // Mettre en cache
      requestCache.set(cacheKey, jsonData, cacheTTL);
      
      setData(jsonData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, options, cacheKey, cacheTTL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
