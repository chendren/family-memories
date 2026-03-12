import { useState } from 'react';
import { FunnelSimple, X } from '@phosphor-icons/react';
import type { SearchFilters as Filters, FamilyMember, MemoryType } from '@family-memories/shared';
import { MEMORY_TYPES } from '@family-memories/shared';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  members: FamilyMember[];
  className?: string;
}

export function SearchFilters({ filters, onChange, members, className }: SearchFiltersProps) {
  const [open, setOpen] = useState(false);

  function toggleType(type: MemoryType) {
    const current = filters.types ?? [];
    const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    onChange({ ...filters, types: updated.length > 0 ? updated : undefined });
  }

  function togglePerson(id: string) {
    const current = filters.person_ids ?? [];
    const updated = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
    onChange({ ...filters, person_ids: updated.length > 0 ? updated : undefined });
  }

  function setDateFrom(from: string) {
    onChange({
      ...filters,
      date_range: { ...filters.date_range, from: from || undefined },
    });
  }

  function setDateTo(to: string) {
    onChange({
      ...filters,
      date_range: { ...filters.date_range, to: to || undefined },
    });
  }

  const hasFilters = (filters.types?.length ?? 0) > 0 || (filters.person_ids?.length ?? 0) > 0 || filters.date_range?.from || filters.date_range?.to;

  return (
    <div className={cn('space-y-3', className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          hasFilters ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        )}
      >
        <FunnelSimple size={16} />
        Filters
        {hasFilters && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange({});
            }}
            className="ml-1"
          >
            <X size={12} />
          </button>
        )}
      </button>

      {open && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {MEMORY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                    (filters.types ?? []).includes(type)
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-500'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">People</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => togglePerson(m.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                      (filters.person_ids ?? []).includes(m.id)
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-500'
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filters.date_range?.from ?? ''}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="date"
                value={filters.date_range?.to ?? ''}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
