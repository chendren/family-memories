import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, X, Tag, User } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import * as searchApi from '@/services/search';
import type { FamilyMember } from '@family-memories/shared';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  members?: FamilyMember[];
}

interface Suggestion {
  text: string;
  type: 'tag' | 'person' | 'memory';
  id?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search memories...', className, autoFocus, members }: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!value || value.length < 1) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const resp = await searchApi.getSuggestions(value);
        setSuggestions(resp.data ?? []);
        setSelectedIdx(-1);
      } catch {
        setSuggestions([]);
      }
    }, 150);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  function handleSelect(suggestion: Suggestion) {
    onChange(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  return (
    <div className={cn('relative', className)}>
      <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-walnut-400" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-white border border-sand-200 rounded-xl pl-12 pr-10 py-3.5 text-sm text-walnut-800 placeholder:text-walnut-400 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-transparent shadow-card font-body"
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            setSuggestions([]);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-walnut-400 hover:text-walnut-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}

      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sand-200 rounded-xl shadow-card z-20 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.id}`}
              onMouseDown={() => handleSelect(s)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-walnut-700 hover:bg-cream-100 transition-colors font-body text-left',
                i === selectedIdx && 'bg-cream-100'
              )}
            >
              {s.type === 'tag' ? (
                <Tag size={14} className="text-terracotta-400 flex-shrink-0" />
              ) : (
                <User size={14} className="text-sage-400 flex-shrink-0" />
              )}
              <span className="truncate">{s.text}</span>
              <span className="text-[10px] text-walnut-300 ml-auto flex-shrink-0 uppercase tracking-wider">{s.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
