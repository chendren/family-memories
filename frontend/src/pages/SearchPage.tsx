import { useState } from 'react';
import { MagnifyingGlass, ChatCircleDots, ListBullets } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import { ConversationalSearch } from '@/components/search/ConversationalSearch';
import { EmptyState } from '@/components/shared/EmptyState';
import { useSearch } from '@/hooks/useSearch';
import { useMembers } from '@/hooks/useFamilyMembers';
import { cn } from '@/lib/utils';

type SearchMode = 'standard' | 'conversational';

export function SearchPage() {
  const [mode, setMode] = useState<SearchMode>('standard');
  const { query, setQuery, filters, setFilters, results, isSearching } = useSearch();
  const { data: membersResponse } = useMembers();
  const members = membersResponse?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <PageHeader
        title="Search"
        subtitle="Find any memory instantly"
        action={
          <div className="flex items-center bg-cream-100 rounded-lg border border-sand-200 p-0.5">
            <button
              onClick={() => setMode('standard')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-body transition-colors',
                mode === 'standard' ? 'bg-white text-walnut-800 shadow-sm' : 'text-walnut-400 hover:text-walnut-600'
              )}
            >
              <ListBullets size={14} />
              Search
            </button>
            <button
              onClick={() => setMode('conversational')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium font-body transition-colors',
                mode === 'conversational' ? 'bg-white text-walnut-800 shadow-sm' : 'text-walnut-400 hover:text-walnut-600'
              )}
            >
              <ChatCircleDots size={14} />
              Ask AI
            </button>
          </div>
        }
      />

      {mode === 'conversational' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ConversationalSearch />
        </motion.div>
      ) : (
        <>
          <SearchBar value={query} onChange={setQuery} autoFocus members={members} />

          <SearchFilters filters={filters} onChange={setFilters} members={members} />

          {isSearching && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-terracotta-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isSearching && results && results.results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <p className="text-xs text-walnut-400 font-body">
                {results.total} result{results.total !== 1 ? 's' : ''} in {results.took_ms}ms
              </p>
              <SearchResults results={results.results} />
            </motion.div>
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
        </>
      )}
    </div>
  );
}
