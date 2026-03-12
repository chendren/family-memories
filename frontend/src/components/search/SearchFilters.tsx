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
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium font-body transition-colors',
          hasFilters ? 'bg-terracotta-50 text-terracotta-600' : 'bg-white text-walnut-500 hover:bg-cream-200 border border-sand-200'
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
        <div className="bg-white border border-sand-200 rounded-xl p-4 space-y-4 shadow-card">
          <div>
            <label className="block text-xs font-medium text-walnut-500 mb-2 font-body">Type</label>
            <div className="flex flex-wrap gap-2">
              {MEMORY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-colors border',
                    (filters.types ?? []).includes(type)
                      ? 'bg-terracotta-50 text-terracotta-600 border-terracotta-200'
                      : 'bg-cream-100 text-walnut-500 border-sand-200 hover:border-sand-300'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-walnut-500 mb-2 font-body">People</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => togglePerson(m.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-colors border',
                      (filters.person_ids ?? []).includes(m.id)
                        ? 'bg-terracotta-50 text-terracotta-600 border-terracotta-200'
                        : 'bg-cream-100 text-walnut-500 border-sand-200 hover:border-sand-300'
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-walnut-500 mb-2 font-body">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filters.date_range?.from ?? ''}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-cream-100 border border-sand-200 rounded-lg px-3 py-1.5 text-xs text-walnut-700 focus:outline-none focus:ring-2 focus:ring-terracotta-300 font-body"
              />
              <input
                type="date"
                value={filters.date_range?.to ?? ''}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-cream-100 border border-sand-200 rounded-lg px-3 py-1.5 text-xs text-walnut-700 focus:outline-none focus:ring-2 focus:ring-terracotta-300 font-body"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
