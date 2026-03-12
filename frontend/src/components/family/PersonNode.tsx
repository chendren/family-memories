import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { FamilyMember } from '@family-memories/shared';

interface PersonNodeData {
  member: FamilyMember;
  memoryCount: number;
  [key: string]: unknown;
}

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 65%)`;
}

function PersonNodeComponent({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const nodeData = data as PersonNodeData;
  const { member, memoryCount } = nodeData;

  const initials = member.name
    .split(' ')
    .map((n: string) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const birthYear = member.birth_date ? new Date(member.birth_date).getFullYear() : null;
  const deathYear = member.death_date ? new Date(member.death_date).getFullYear() : null;
  const lifespan = birthYear
    ? `${birthYear} – ${deathYear ?? 'present'}`
    : null;

  const avatarBg = nameToColor(member.name);

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-sand-300 !border-2 !border-cream-100 !-top-1.5"
      />

      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{
          scale: hovered ? 1.05 : 1,
          boxShadow: hovered
            ? '0 8px 30px rgba(224, 122, 95, 0.2)'
            : '0 2px 12px rgba(61, 44, 46, 0.1)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`
          relative flex flex-col items-center px-4 py-3 rounded-2xl cursor-pointer
          bg-white border
          ${selected ? 'border-terracotta-400 ring-2 ring-terracotta-200' : 'border-sand-200'}
          min-w-[160px]
        `}
      >
        {memoryCount > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-terracotta-500 flex items-center justify-center shadow-warm">
            <span className="text-[10px] font-bold text-white font-body">{memoryCount}</span>
          </div>
        )}

        <div
          className="w-16 h-16 rounded-full border-2 border-sand-200 flex items-center justify-center overflow-hidden mb-2 shadow-card"
          style={{ backgroundColor: member.photo_path ? 'transparent' : avatarBg }}
        >
          {member.photo_path ? (
            <img
              src={`/${member.photo_path}`}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-base font-bold text-white/90 font-body">{initials}</span>
          )}
        </div>

        <span className="text-xs font-semibold text-walnut-800 text-center leading-tight max-w-[140px] truncate font-display">
          {member.name}
        </span>

        {member.nickname && (
          <span className="text-[10px] text-walnut-500 italic mt-0.5 font-body">
            &ldquo;{member.nickname}&rdquo;
          </span>
        )}

        {lifespan && (
          <span className="text-[10px] text-walnut-400 mt-0.5 font-body">{lifespan}</span>
        )}
      </motion.div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-sand-300 !border-2 !border-cream-100 !-bottom-1.5"
      />
    </>
  );
}

export const PersonNode = memo(PersonNodeComponent);
