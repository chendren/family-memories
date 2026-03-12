import { useState, useEffect, useRef, useCallback } from 'react';
import type { SearchResponse, SearchFilters } from '@family-memories/shared';
import * as searchApi from '@/services/search';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, f: SearchFilters) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const response = await searchApi.search({ query: q, filters: f, limit: 20 });
      setResults(response);
    } catch {
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doSearch(query, filters);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, filters, doSearch]);

  return { query, setQuery, filters, setFilters, results, isSearching };
}
