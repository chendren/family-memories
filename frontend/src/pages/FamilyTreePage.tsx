import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Link as LinkIcon,
  X,
  UserCircle,
  Calendar,
  ArrowRight,
} from '@phosphor-icons/react';
import { FamilyTree } from '@/components/family/FamilyTree';
import { AddMemberForm } from '@/components/family/AddMemberForm';
import { RelationshipForm } from '@/components/family/RelationshipForm';
import { useMember } from '@/hooks/useFamilyMembers';
import { useMemories } from '@/hooks/useMemories';

export function FamilyTreePage() {
  const navigate = useNavigate();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: memberResponse } = useMember(selectedId ?? undefined);
  const { data: memoriesResponse } = useMemories(
    selectedId ? { person_id: selectedId, limit: 5 } : undefined
  );

  const member = memberResponse?.data;
  const memories = memoriesResponse?.data ?? [];

  const handleNodeClick = useCallback((memberId: string) => {
    setSelectedId((prev) => (prev === memberId ? null : memberId));
  }, []);

  const closeSidebar = useCallback(() => {
    setSelectedId(null);
  }, []);

  const birthYear = member?.birth_date ? new Date(member.birth_date).getFullYear() : null;
  const deathYear = member?.death_date ? new Date(member.death_date).getFullYear() : null;

  const initials = member
    ? member.name
        .split(' ')
        .map((n: string) => n.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col relative overflow-hidden">
      {/* Floating action buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => setShowAddRelationship(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-sand-200 hover:border-terracotta-200 text-walnut-600 hover:text-terracotta-500 font-medium rounded-lg text-sm transition-all shadow-card font-body"
        >
          <LinkIcon size={16} />
          <span className="hidden sm:inline">Relationship</span>
        </button>
        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2 px-3 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-lg text-sm transition-colors shadow-warm font-body"
        >
          <Plus size={16} weight="bold" />
          <span className="hidden sm:inline">Add Member</span>
        </button>
      </div>

      {/* Tree canvas */}
      <div className="flex-1">
        <FamilyTree onNodeClick={handleNodeClick} />
      </div>

      {/* Person sidebar */}
      <AnimatePresence>
        {selectedId && member && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-md border-l border-sand-200 z-30 overflow-y-auto shadow-xl"
          >
            <div className="p-5">
              {/* Close button */}
              <button
                onClick={closeSidebar}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-walnut-400 hover:text-walnut-600 hover:bg-cream-200 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center pt-2 pb-4">
                <div className="w-20 h-20 rounded-full bg-cream-200 border-2 border-sand-200 flex items-center justify-center overflow-hidden mb-3">
                  {member.photo_path ? (
                    <img
                      src={`/${member.photo_path}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle size={48} className="text-sand-300" weight="duotone" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-walnut-900 font-display">{member.name}</h3>
                {member.nickname && (
                  <p className="text-sm text-walnut-500 italic font-body">
                    &ldquo;{member.nickname}&rdquo;
                  </p>
                )}
                {birthYear && (
                  <p className="flex items-center gap-1 text-xs text-walnut-400 mt-1 font-body">
                    <Calendar size={12} />
                    {birthYear}{deathYear ? ` – ${deathYear}` : ' – present'}
                  </p>
                )}
              </div>

              {/* Bio */}
              {member.bio && (
                <div className="mb-4">
                  <p className="text-sm text-walnut-600 leading-relaxed font-body">{member.bio}</p>
                </div>
              )}

              {/* Recent memories */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-walnut-400 uppercase tracking-wider mb-2 font-body">
                  Recent Memories
                </h4>
                {memories.length > 0 ? (
                  <div className="space-y-2">
                    {memories.map((memory) => (
                      <button
                        key={memory.id}
                        onClick={() => navigate(`/memories/${memory.id}`)}
                        className="w-full text-left p-3 rounded-lg bg-cream-100 border border-sand-200 hover:border-terracotta-200 transition-colors"
                      >
                        <p className="text-sm font-medium text-walnut-700 truncate font-body">
                          {memory.title}
                        </p>
                        <p className="text-xs text-walnut-400 mt-0.5 font-body">
                          {memory.memory_type}
                          {memory.memory_date ? ` · ${memory.memory_date}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-walnut-400 font-body">No memories tagged with this person yet.</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/person/${selectedId}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terracotta-500 text-white font-semibold rounded-lg text-sm hover:bg-terracotta-600 transition-colors font-body"
                >
                  View Profile
                  <ArrowRight size={14} weight="bold" />
                </button>
                <button
                  onClick={() => {
                    setShowAddRelationship(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cream-200 text-walnut-600 font-medium rounded-lg text-sm hover:bg-cream-300 transition-colors border border-sand-200 font-body"
                >
                  <LinkIcon size={14} />
                  Add Relationship
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddMemberForm
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
      />
      <RelationshipForm
        open={showAddRelationship}
        onClose={() => setShowAddRelationship(false)}
        preselectedFromId={selectedId ?? undefined}
      />
    </div>
  );
}
