import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { useAddRelationship, useMembers } from '@/hooks/useFamilyMembers';
import type { RelationshipCreate, RelationshipType } from '@family-memories/shared';
import { RELATIONSHIP_TYPES } from '@family-memories/shared';

interface RelationshipFormProps {
  open: boolean;
  onClose: () => void;
  preselectedFromId?: string;
}

const TYPE_LABELS: Record<RelationshipType, string> = {
  parent: 'Parent of',
  spouse: 'Spouse of',
  sibling: 'Sibling of',
  step_parent: 'Step-Parent of',
  adopted_parent: 'Adopted Parent of',
  partner: 'Partner of',
};

export function RelationshipForm({ open, onClose, preselectedFromId }: RelationshipFormProps) {
  const addRelationship = useAddRelationship();
  const { data: membersResponse } = useMembers();
  const members = membersResponse?.data ?? [];

  const [fromId, setFromId] = useState(preselectedFromId ?? '');
  const [toId, setToId] = useState('');
  const [type, setType] = useState<RelationshipType>('parent');
  const [notes, setNotes] = useState('');

  function resetForm() {
    if (!preselectedFromId) setFromId('');
    setToId('');
    setType('parent');
    setNotes('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromId || !toId || fromId === toId) return;

    const payload: RelationshipCreate = {
      from_member_id: fromId,
      to_member_id: toId,
      relationship_type: type,
    };
    if (notes.trim()) payload.notes = notes.trim();

    try {
      await addRelationship.mutateAsync(payload);
      resetForm();
      onClose();
    } catch {
      // Error toast handled by mutation hook
    }
  }

  const isSelfRelation = fromId && toId && fromId === toId;

  const inputClass =
    'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-slate-100">Add Relationship</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">From</label>
                  <select
                    value={fromId}
                    onChange={(e) => setFromId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select person...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Relationship
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as RelationshipType)}
                    className={inputClass}
                  >
                    {RELATIONSHIP_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {TYPE_LABELS[rt]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">To</label>
                  <select
                    value={toId}
                    onChange={(e) => setToId(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select person...</option>
                    {members
                      .filter((m) => m.id !== fromId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                  </select>
                </div>

                {isSelfRelation && (
                  <p className="text-xs text-red-400">
                    Cannot create a relationship between a person and themselves.
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes about this relationship..."
                    rows={2}
                    className={inputClass + ' resize-none'}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!fromId || !toId || !!isSelfRelation || addRelationship.isPending}
                    className="flex-1 px-4 py-2.5 bg-amber-500 text-slate-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addRelationship.isPending ? 'Adding...' : 'Add Relationship'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
