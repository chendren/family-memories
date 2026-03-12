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
  photo: 'bg-purple-500/20 text-purple-400',
  audio: 'bg-blue-500/20 text-blue-400',
  video: 'bg-pink-500/20 text-pink-400',
  text: 'bg-green-500/20 text-green-400',
  document: 'bg-orange-500/20 text-orange-400',
};

export function MemoryCard({ memory, thumbnailPath, people, className }: MemoryCardProps) {
  const navigate = useNavigate();
  const Icon = typeIcons[memory.memory_type] ?? TextT;

  const dateStr = memory.memory_date ?? memory.created_at;
  const formattedDate = dateStr ? format(new Date(dateStr), 'MMM d, yyyy') : '';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/memories/${memory.id}`)}
      className={cn(
        'bg-slate-800 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer overflow-hidden shadow-lg shadow-black/20',
        className
      )}
    >
      {thumbnailPath ? (
        <div className="aspect-video w-full overflow-hidden bg-slate-900">
          <img src={thumbnailPath} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video w-full overflow-hidden bg-slate-900/50 flex items-center justify-center">
          <Icon size={40} className="text-slate-600" />
        </div>
      )}

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{memory.title}</h3>
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0', typeColors[memory.memory_type])}>
            {memory.memory_type}
          </span>
        </div>

        {memory.content && (
          <p className="text-xs text-slate-400 line-clamp-2">{memory.content}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-500">{formattedDate}</span>

          <div className="flex items-center gap-1">
            {people?.slice(0, 3).map((p) => (
              <div
                key={p.family_member_id}
                className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden"
                title={p.name}
              >
                {p.photo_path ? (
                  <img src={p.photo_path} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[8px] text-slate-400">{p.name.charAt(0)}</span>
                )}
              </div>
            ))}
            {(people?.length ?? 0) > 3 && (
              <span className="text-[10px] text-slate-500">+{(people?.length ?? 0) - 3}</span>
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
