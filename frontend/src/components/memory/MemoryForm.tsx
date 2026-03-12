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
    'w-full bg-cream-100 border border-sand-200 rounded-lg px-3 py-2 text-sm text-walnut-800 placeholder:text-walnut-400 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-transparent font-body';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <label className="block text-xs font-medium text-walnut-500 mb-1 font-body">Title</label>
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
        <label className="block text-xs font-medium text-walnut-500 mb-1 font-body">Content</label>
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
          <label className="block text-xs font-medium text-walnut-500 mb-1 font-body">Type</label>
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
          <label className="block text-xs font-medium text-walnut-500 mb-1 font-body">Date</label>
          <input
            type="date"
            value={memoryDate}
            onChange={(e) => setMemoryDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-walnut-500 mb-1 font-body">Location</label>
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
        className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50 font-body"
      >
        {isLoading ? 'Saving...' : mode === 'create' ? 'Create Memory' : 'Save Changes'}
      </button>
    </form>
  );
}
