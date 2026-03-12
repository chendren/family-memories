import type { SearchResult } from '@family-memories/shared';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryGrid } from '@/components/memory/MemoryGrid';

interface SearchResultsProps {
  results: SearchResult[];
  className?: string;
}

export function SearchResults({ results, className }: SearchResultsProps) {
  return (
    <MemoryGrid className={className}>
      {results.map((result) => (
        <div key={result.memory.id} className="relative">
          <MemoryCard
            memory={result.memory}
            thumbnailPath={result.thumbnail_path}
            people={result.people}
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {Math.round(result.score * 100)}%
          </div>
          {result.snippet && (
            <div className="mt-1 px-4 pb-2">
              <p className="text-xs text-slate-500 line-clamp-2">{result.snippet}</p>
            </div>
          )}
        </div>
      ))}
    </MemoryGrid>
  );
}
