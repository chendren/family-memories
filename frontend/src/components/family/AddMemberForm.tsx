import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { useAddMember } from '@/hooks/useFamilyMembers';
import type { FamilyMemberCreate, Gender } from '@family-memories/shared';
import { GENDERS } from '@family-memories/shared';

interface AddMemberFormProps {
  open: boolean;
  onClose: () => void;
}

export function AddMemberForm({ open, onClose }: AddMemberFormProps) {
  const addMember = useAddMember();

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');

  function resetForm() {
    setName('');
    setNickname('');
    setBirthDate('');
    setDeathDate('');
    setBio('');
    setGender('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: FamilyMemberCreate = {
      name: name.trim(),
    };
    if (nickname.trim()) payload.nickname = nickname.trim();
    if (birthDate) payload.birth_date = birthDate;
    if (deathDate) payload.death_date = deathDate;
    if (bio.trim()) payload.bio = bio.trim();
    if (gender) payload.gender = gender as Gender;

    try {
      await addMember.mutateAsync(payload);
      resetForm();
      onClose();
    } catch {
      // Error toast handled by mutation hook
    }
  }

  const inputClass =
    'w-full bg-cream-100 border border-sand-200 rounded-lg px-3 py-2 text-sm text-walnut-800 placeholder:text-walnut-400 focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 font-body';

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
              className="bg-white border border-sand-200 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-sand-200">
                <h2 className="text-lg font-semibold text-walnut-900 font-display">Add Family Member</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-walnut-400 hover:text-walnut-600 hover:bg-cream-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">
                    Name <span className="text-terracotta-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    required
                    autoFocus
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Optional nickname"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender | '')}
                    className={inputClass}
                  >
                    <option value="">Select...</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">
                      Death Date
                    </label>
                    <input
                      type="date"
                      value={deathDate}
                      onChange={(e) => setDeathDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-walnut-700 mb-1.5 font-body">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A short biography..."
                    rows={3}
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
                    disabled={!name.trim() || addMember.isPending}
                    className="flex-1 px-4 py-2.5 bg-terracotta-500 text-white rounded-lg text-sm font-semibold hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body"
                  >
                    {addMember.isPending ? 'Adding...' : 'Add Member'}
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
