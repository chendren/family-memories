import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { FamilyMember } from '@family-memories/shared';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  member: FamilyMember & { memory_count?: number };
  className?: string;
}

export function MemberCard({ member, className }: MemberCardProps) {
  const navigate = useNavigate();

  const birthYear = member.birth_date ? new Date(member.birth_date).getFullYear() : null;
  const deathYear = member.death_date ? new Date(member.death_date).getFullYear() : null;
  const lifespan = birthYear
    ? `${birthYear} - ${deathYear ?? 'present'}`
    : null;

  const initials = member.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/person/${member.id}`)}
      className={cn(
        'bg-slate-800 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer p-5 flex flex-col items-center text-center shadow-lg shadow-black/20',
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden mb-3">
        {member.photo_path ? (
          <img src={member.photo_path} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-slate-400">{initials}</span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-slate-100">{member.name}</h3>
      {member.nickname && (
        <p className="text-xs text-slate-400 mt-0.5">"{member.nickname}"</p>
      )}
      {lifespan && (
        <p className="text-xs text-slate-500 mt-1">{lifespan}</p>
      )}
      {typeof member.memory_count === 'number' && (
        <span className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {member.memory_count} {member.memory_count === 1 ? 'memory' : 'memories'}
        </span>
      )}
    </motion.div>
  );
}
