import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UsersThree, Link as LinkIcon, TreeStructure } from '@phosphor-icons/react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MemberCard } from '@/components/family/MemberCard';
import { AddMemberForm } from '@/components/family/AddMemberForm';
import { RelationshipForm } from '@/components/family/RelationshipForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { useMembers } from '@/hooks/useFamilyMembers';

export function FamilyMembersPage() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRelForm, setShowRelForm] = useState(false);
  const { data: membersResponse, isLoading } = useMembers();

  const members = membersResponse?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <PageHeader
        title="Family Members"
        subtitle={`${members.length} member${members.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/family')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg text-sm transition-colors border border-slate-600"
            >
              <TreeStructure size={16} />
              Tree View
            </button>
            {members.length >= 2 && (
              <button
                onClick={() => setShowRelForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg text-sm transition-colors border border-slate-600"
              >
                <LinkIcon size={16} />
                Relationship
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
            >
              <Plus size={16} weight="bold" />
              Add Member
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : members.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<UsersThree size={48} />}
          title="No family members yet"
          message="Start building your family tree by adding members"
          action={
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors"
            >
              Add First Member
            </button>
          }
        />
      )}

      <AddMemberForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
      />

      <RelationshipForm
        open={showRelForm}
        onClose={() => setShowRelForm(false)}
      />
    </div>
  );
}
