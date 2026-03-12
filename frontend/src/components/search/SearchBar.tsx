import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, placeholder = 'Search memories...', className, autoFocus }: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-walnut-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-white border border-sand-200 rounded-xl pl-12 pr-10 py-3.5 text-sm text-walnut-800 placeholder:text-walnut-400 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-transparent shadow-card font-body"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-walnut-400 hover:text-walnut-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
