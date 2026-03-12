import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, PencilSimple, Calendar, MapPin } from '@phosphor-icons/react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { MemoryGrid } from '@/components/memory/MemoryGrid';
import { EmptyState } from '@/components/shared/EmptyState';
import { useMember, useUpdateMember } from '@/hooks/useFamilyMembers';
import { useMemories } from '@/hooks/useMemories';
import type { FamilyMemberUpdate } from '@family-memories/shared';

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const { data: memberResponse, isLoading } = useMember(id);
  const { data: memoriesResponse } = useMemories({ person_id: id, limit: 50 });
  const updateMember = useUpdateMember();

  const member = memberResponse?.data;
  const memories = memoriesResponse?.data ?? [];

  const [editForm, setEditForm] = useState<FamilyMemberUpdate>({});

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-terracotta-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 text-center">
        <p className="text-walnut-500 font-body">Person not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-terracotta-500 hover:text-terracotta-600 text-sm font-body">
          Go back
        </button>
      </div>
    );
  }

  const initials = member.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const birthYear = member.birth_date ? new Date(member.birth_date).getFullYear() : null;
  const deathYear = member.death_date ? new Date(member.death_date).getFullYear() : null;

  function startEdit() {
    setEditForm({
      name: member!.name,
      nickname: member!.nickname ?? undefined,
      birth_date: member!.birth_date ?? undefined,
      death_date: member!.death_date ?? undefined,
      bio: member!.bio ?? undefined,
      gender: member!.gender ?? undefined,
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!id) return;
    await updateMember.mutateAsync({ id, data: editForm });
    setEditing(false);
  }

  const inputClass =
    'w-full bg-cream-100 border border-sand-200 rounded-lg px-3 py-2 text-sm text-walnut-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300 font-body';

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-walnut-500 hover:text-walnut-700 text-sm transition-colors font-body"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Person Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-sand-200 p-6 shadow-card"
      >
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 rounded-full bg-cream-200 border-2 border-sand-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {member.photo_path ? (
              <img src={member.photo_path} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-walnut-400 font-body">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={inputClass}
                  placeholder="Name"
                />
                <input
                  value={editForm.nickname ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  className={inputClass}
                  placeholder="Nickname"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={editForm.birth_date ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="date"
                    value={editForm.death_date ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, death_date: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <textarea
                  value={editForm.bio ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Bio"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-cream-200 text-walnut-600 rounded-lg text-sm font-body"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={updateMember.isPending}
                    className="px-4 py-2 bg-terracotta-500 text-white font-semibold rounded-lg text-sm font-body"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-walnut-900 font-display">{member.name}</h1>
                  <button
                    onClick={startEdit}
                    className="p-1.5 rounded-lg text-walnut-400 hover:text-walnut-600 hover:bg-cream-200 transition-colors"
                  >
                    <PencilSimple size={16} />
                  </button>
                </div>
                {member.nickname && (
                  <p className="text-walnut-500 mt-0.5 font-body italic">"{member.nickname}"</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-walnut-400 font-body">
                  {birthYear && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {birthYear}{deathYear ? ` - ${deathYear}` : ' - present'}
                    </span>
                  )}
                </div>
                {member.bio && (
                  <p className="text-sm text-walnut-600 mt-3 leading-relaxed font-body">{member.bio}</p>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Their Memories */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-walnut-900 font-display">
          Memories ({memories.length})
        </h2>
        {memories.length > 0 ? (
          <MemoryGrid>
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </MemoryGrid>
        ) : (
          <EmptyState
            title="No memories yet"
            message={`No memories have been tagged with ${member.name}`}
          />
        )}
      </div>
    </div>
  );
}
