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
          className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 font-medium rounded-lg text-sm transition-all shadow-lg"
        >
          <LinkIcon size={16} />
          <span className="hidden sm:inline">Relationship</span>
        </button>
        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors shadow-lg shadow-amber-500/20"
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
            className="absolute top-0 right-0 h-full w-80 bg-slate-800/95 backdrop-blur-md border-l border-slate-700 z-30 overflow-y-auto shadow-2xl"
          >
            <div className="p-5">
              {/* Close button */}
              <button
                onClick={closeSidebar}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center pt-2 pb-4">
                <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden mb-3">
                  {member.photo_path ? (
                    <img
                      src={`/${member.photo_path}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle size={48} className="text-slate-500" weight="duotone" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{member.name}</h3>
                {member.nickname && (
                  <p className="text-sm text-slate-400 italic">
                    &ldquo;{member.nickname}&rdquo;
                  </p>
                )}
                {birthYear && (
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Calendar size={12} />
                    {birthYear}{deathYear ? ` – ${deathYear}` : ' – present'}
                  </p>
                )}
              </div>

              {/* Bio */}
              {member.bio && (
                <div className="mb-4">
                  <p className="text-sm text-slate-300 leading-relaxed">{member.bio}</p>
                </div>
              )}

              {/* Recent memories */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Recent Memories
                </h4>
                {memories.length > 0 ? (
                  <div className="space-y-2">
                    {memories.map((memory) => (
                      <button
                        key={memory.id}
                        onClick={() => navigate(`/memories/${memory.id}`)}
                        className="w-full text-left p-3 rounded-lg bg-slate-700/50 border border-slate-700 hover:border-amber-500/30 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {memory.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {memory.memory_type}
                          {memory.memory_date ? ` · ${memory.memory_date}` : ''}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No memories tagged with this person yet.</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/person/${selectedId}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-slate-900 font-semibold rounded-lg text-sm hover:bg-amber-400 transition-colors"
                >
                  View Profile
                  <ArrowRight size={14} weight="bold" />
                </button>
                <button
                  onClick={() => {
                    setShowAddRelationship(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg text-sm hover:bg-slate-600 transition-colors border border-slate-600"
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
