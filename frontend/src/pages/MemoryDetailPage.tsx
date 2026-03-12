import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PencilSimple, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import { MemoryDetail } from '@/components/memory/MemoryDetail';
import { MemoryForm } from '@/components/memory/MemoryForm';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryGrid } from '@/components/memory/MemoryGrid';
import { useMemory, useUpdateMemory, useDeleteMemory, useRelatedMemories } from '@/hooks/useMemories';

export function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const { data: memoryResponse, isLoading } = useMemory(id);
  const { data: relatedResponse } = useRelatedMemories(id);
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();

  const memory = memoryResponse?.data;
  const relatedMemories = relatedResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-terracotta-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 text-center">
        <p className="text-walnut-500 font-body">Memory not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-terracotta-500 hover:text-terracotta-600 text-sm font-body"
        >
          Go back
        </button>
      </div>
    );
  }

  async function handleDelete() {
    if (!id) return;
    if (window.confirm('Delete this memory? This cannot be undone.')) {
      await deleteMemory.mutateAsync(id);
      navigate('/timeline');
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-walnut-500 hover:text-walnut-700 text-sm transition-colors font-body"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="p-2 rounded-lg bg-white text-walnut-500 hover:text-walnut-700 border border-sand-200 transition-colors"
          >
            <PencilSimple size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-white text-red-400 hover:text-red-500 border border-sand-200 transition-colors"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="bg-white border border-sand-200 rounded-xl p-5 shadow-card">
          <h2 className="text-lg font-semibold text-walnut-900 mb-4 font-display">Edit Memory</h2>
          <MemoryForm
            mode="edit"
            initialValues={{
              title: memory.title,
              content: memory.content ?? undefined,
              memory_date: memory.memory_date ?? undefined,
              location: memory.location ?? undefined,
            }}
            onSubmit={async (values) => {
              if (!id) return;
              await updateMemory.mutateAsync({ id, data: values });
              setEditing(false);
            }}
            isLoading={updateMemory.isPending}
          />
        </div>
      ) : (
        <MemoryDetail memory={memory} />
      )}

      {relatedMemories.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-walnut-900 font-display">Related Memories</h2>
          <MemoryGrid>
            {relatedMemories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </MemoryGrid>
        </div>
      )}
    </div>
  );
}
