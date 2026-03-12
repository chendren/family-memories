import { useState } from 'react';
import type { MemoryCreate, MemoryUpdate, MemoryType } from '@family-memories/shared';
import { MEMORY_TYPES } from '@family-memories/shared';
import { cn } from '@/lib/utils';

interface MemoryFormProps {
  initialValues?: Partial<MemoryCreate & MemoryUpdate>;
  onSubmit: (values: MemoryCreate | MemoryUpdate) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  className?: string;
}

export function MemoryForm({ initialValues, onSubmit, isLoading, mode, className }: MemoryFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [memoryDate, setMemoryDate] = useState(initialValues?.memory_date ?? '');
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [memoryType, setMemoryType] = useState<MemoryType>(
    (initialValues as MemoryCreate)?.memory_type ?? 'text'
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'create') {
      onSubmit({
        title,
        content: content || undefined,
        memory_type: memoryType,
        memory_date: memoryDate || undefined,
        location: location || undefined,
      } as MemoryCreate);
    } else {
      onSubmit({
        title: title || undefined,
        content: content || undefined,
        memory_date: memoryDate || undefined,
        location: location || undefined,
      } as MemoryUpdate);
    }
  }

  const inputClass =
    'w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Memory title"
          required={mode === 'create'}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What happened?"
          rows={4}
          className={cn(inputClass, 'resize-none')}
        />
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
          <select
            value={memoryType}
            onChange={(e) => setMemoryType(e.target.value as MemoryType)}
            className={inputClass}
          >
            {MEMORY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
          <input
            type="date"
            value={memoryDate}
            onChange={(e) => setMemoryDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where?"
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || (mode === 'create' && !title.trim())}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : mode === 'create' ? 'Create Memory' : 'Save Changes'}
      </button>
    </form>
  );
}
