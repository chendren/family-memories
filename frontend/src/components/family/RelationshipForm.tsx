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
    'w-full bg-cream-100 border border-sand-200 rounded-lg px-3 py-2 text-sm text-walnut-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 font-body';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-walnut-900/30 backdrop-blur-sm"
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
              className="bg-white border border-sand-200 rounded-2xl shadow-xl w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-sand-200">
                <h2 className="text-lg font-semibold text-walnut-900 font-display">Add Relationship</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-walnut-400 hover:text-walnut-600 hover:bg-cream-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">From</label>
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
                  <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">
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
                  <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">To</label>
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
                  <p className="text-xs text-red-500 font-body">
                    Cannot create a relationship between a person and themselves.
                  </p>
                )}

                <div>
                  <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">
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
                    className="flex-1 px-4 py-2.5 bg-cream-200 text-walnut-600 rounded-lg text-sm font-medium hover:bg-cream-300 transition-colors font-body"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!fromId || !toId || !!isSelfRelation || addRelationship.isPending}
                    className="flex-1 px-4 py-2.5 bg-terracotta-500 text-white rounded-lg text-sm font-semibold hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body"
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
