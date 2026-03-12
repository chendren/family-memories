import { MagnifyingGlass } from '@phosphor-icons/react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import { EmptyState } from '@/components/shared/EmptyState';
import { useSearch } from '@/hooks/useSearch';
import { useMembers } from '@/hooks/useFamilyMembers';

export function SearchPage() {
  const { query, setQuery, filters, setFilters, results, isSearching } = useSearch();
  const { data: membersResponse } = useMembers();
  const members = membersResponse?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <PageHeader title="Search" subtitle="Find any memory instantly" />

      <SearchBar value={query} onChange={setQuery} autoFocus />

      <SearchFilters filters={filters} onChange={setFilters} members={members} />

      {isSearching && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-terracotta-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isSearching && results && results.results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-walnut-400 font-body">
            {results.total} result{results.total !== 1 ? 's' : ''} in {results.took_ms}ms
          </p>
          <SearchResults results={results.results} />
        </div>
      )}

      {!isSearching && results && results.results.length === 0 && (
        <EmptyState
          icon={<MagnifyingGlass size={48} />}
          title="No results found"
          message={`Nothing matched "${query}". Try different keywords or adjust your filters.`}
        />
      )}

      {!isSearching && !results && !query && (
        <EmptyState
          icon={<MagnifyingGlass size={48} />}
          title="Search your memories"
          message="Try searching for people, places, events, or feelings. AI-powered semantic search understands natural language."
        />
      )}
    </div>
  );
}
