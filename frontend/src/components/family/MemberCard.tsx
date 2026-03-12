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
      whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(61, 44, 46, 0.12)' }}
      onClick={() => navigate(`/person/${member.id}`)}
      className={cn(
        'bg-white rounded-xl border border-sand-200 hover:border-terracotta-200 transition-colors cursor-pointer p-5 flex flex-col items-center text-center shadow-card',
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-cream-200 border-2 border-sand-200 flex items-center justify-center overflow-hidden mb-3">
        {member.photo_path ? (
          <img src={member.photo_path} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-walnut-500 font-body">{initials}</span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-walnut-800 font-display">{member.name}</h3>
      {member.nickname && (
        <p className="text-xs text-walnut-500 mt-0.5 font-body">"{member.nickname}"</p>
      )}
      {lifespan && (
        <p className="text-xs text-walnut-400 mt-1 font-body">{lifespan}</p>
      )}
      {typeof member.memory_count === 'number' && (
        <span className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-terracotta-50 text-terracotta-600 border border-terracotta-200 font-body">
          {member.memory_count} {member.memory_count === 1 ? 'memory' : 'memories'}
        </span>
      )}
    </motion.div>
  );
}
