import { useState } from 'react';
import { X, Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  className?: string;
}

export function TagEditor({ tags, onChange, suggestions = [], className }: TagEditorProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  function addTag(tag: string) {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
    }
    setInput('');
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s.toLowerCase())
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-terracotta-50 text-terracotta-600 border border-terracotta-200 font-body"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-terracotta-700 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Add tag..."
            className="flex-1 bg-cream-100 border border-sand-200 rounded-lg px-3 py-1.5 text-xs text-walnut-800 placeholder:text-walnut-400 focus:outline-none focus:ring-2 focus:ring-terracotta-300 font-body"
          />
          <button
            type="button"
            onClick={() => addTag(input)}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg bg-cream-200 text-walnut-600 hover:bg-cream-300 disabled:opacity-50 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && input && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sand-200 rounded-lg shadow-card z-10 max-h-32 overflow-y-auto">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-xs text-walnut-600 hover:bg-cream-100 transition-colors font-body"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
