import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Image, Waveform, VideoCamera, TextT, File } from '@phosphor-icons/react';
import type { Memory, FamilyMemberRef } from '@family-memories/shared';
import { ProcessingBadge } from '@/components/shared/ProcessingBadge';
import { cn } from '@/lib/utils';

interface MemoryCardProps {
  memory: Memory;
  thumbnailPath?: string | null;
  people?: FamilyMemberRef[];
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  photo: Image,
  audio: Waveform,
  video: VideoCamera,
  text: TextT,
  document: File,
};

const typeColors: Record<string, string> = {
  photo: 'bg-terracotta-50 text-terracotta-500',
  audio: 'bg-sage-50 text-sage-400',
  video: 'bg-gold-50 text-gold-400',
  text: 'bg-cream-300 text-walnut-600',
  document: 'bg-sand-100 text-walnut-500',
};

export function MemoryCard({ memory, thumbnailPath, people, className }: MemoryCardProps) {
  const navigate = useNavigate();
  const Icon = typeIcons[memory.memory_type] ?? TextT;

  const dateStr = memory.memory_date ?? memory.created_at;
  const formattedDate = dateStr ? format(new Date(dateStr), 'MMM d, yyyy') : '';

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(61, 44, 46, 0.12), 0 2px 8px rgba(61, 44, 46, 0.06)' }}
      onClick={() => navigate(`/memories/${memory.id}`)}
      className={cn(
        'bg-white rounded-xl border border-sand-200 hover:border-terracotta-200 transition-colors cursor-pointer overflow-hidden shadow-card',
        className
      )}
    >
      {thumbnailPath ? (
        <div className="aspect-video w-full overflow-hidden bg-cream-200">
          <img src={thumbnailPath} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video w-full overflow-hidden bg-cream-200/50 flex items-center justify-center">
          <Icon size={40} className="text-sand-300" />
        </div>
      )}

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-walnut-800 line-clamp-1 font-display">{memory.title}</h3>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 font-body', typeColors[memory.memory_type])}>
            {memory.memory_type}
          </span>
        </div>

        {memory.content && (
          <p className="text-xs text-walnut-500 line-clamp-2 font-body">{memory.content}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-walnut-400 font-body">{formattedDate}</span>

          <div className="flex items-center gap-1">
            {people?.slice(0, 3).map((p) => (
              <div
                key={p.family_member_id}
                className="w-5 h-5 rounded-full bg-cream-200 border border-sand-200 flex items-center justify-center overflow-hidden"
                title={p.name}
              >
                {p.photo_path ? (
                  <img src={p.photo_path} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] text-walnut-500">{p.name.charAt(0)}</span>
                )}
              </div>
            ))}
            {(people?.length ?? 0) > 3 && (
              <span className="text-[10px] text-walnut-400">+{(people?.length ?? 0) - 3}</span>
            )}
          </div>
        </div>

        {memory.processing_status !== 'completed' && (
          <ProcessingBadge status={memory.processing_status} />
        )}
      </div>
    </motion.div>
  );
}
