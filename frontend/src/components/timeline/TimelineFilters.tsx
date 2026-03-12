import type { MemoryType, FamilyMember } from '@family-memories/shared';
import { MEMORY_TYPES } from '@family-memories/shared';
import type { TimelineFilters as Filters } from '@/hooks/useTimeline';
import { cn } from '@/lib/utils';

interface TimelineFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  members: FamilyMember[];
  className?: string;
}

const allTypes: Array<MemoryType | 'all'> = ['all', ...MEMORY_TYPES];

export function TimelineFilters({ filters, onChange, members, className }: TimelineFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Type pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {allTypes.map((type) => (
          <button
            key={type}
            onClick={() => onChange({ ...filters, type: type === 'all' ? undefined : type as MemoryType })}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
              (type === 'all' && !filters.type) || filters.type === type
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
            )}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Person select */}
      {members.length > 0 && (
        <select
          value={filters.person_id ?? ''}
          onChange={(e) => onChange({ ...filters, person_id: e.target.value || undefined })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All people</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}

      {/* Date range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <span className="text-xs text-slate-500">to</span>
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
    </div>
  );
}
