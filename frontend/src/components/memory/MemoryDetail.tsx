import { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, Sparkle } from '@phosphor-icons/react';
import type { MemoryWithRelations } from '@family-memories/shared';
import { ProcessingBadge } from '@/components/shared/ProcessingBadge';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { MediaPlayer } from '@/components/shared/MediaPlayer';
import { cn } from '@/lib/utils';

interface MemoryDetailProps {
  memory: MemoryWithRelations;
  className?: string;
}

export function MemoryDetail({ memory, className }: MemoryDetailProps) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const firstAsset = memory.assets[0];
  const isImage = firstAsset?.mime_type.startsWith('image/');
  const isAudio = firstAsset?.mime_type.startsWith('audio/');
  const isVideo = firstAsset?.mime_type.startsWith('video/');

  return (
    <div className={cn('space-y-6', className)}>
      {firstAsset && (
        <div className="rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
          {isImage && (
            <img
              src={`/media/originals/${firstAsset.file_path}`}
              alt={memory.title}
              className="w-full max-h-[60vh] object-contain cursor-pointer"
              onClick={() => setViewerSrc(`/media/originals/${firstAsset.file_path}`)}
            />
          )}
          {isAudio && <MediaPlayer src={`/media/originals/${firstAsset.file_path}`} type="audio" />}
          {isVideo && <MediaPlayer src={`/media/originals/${firstAsset.file_path}`} type="video" />}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-100">{memory.title}</h1>
          <ProcessingBadge status={memory.processing_status} />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
          {memory.memory_date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {format(new Date(memory.memory_date), 'MMMM d, yyyy')}
            </span>
          )}
          {memory.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {memory.location}
            </span>
          )}
        </div>

        {memory.content && (
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{memory.content}</p>
        )}

        {memory.summary && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
              <Sparkle size={16} weight="fill" />
              AI Summary
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{memory.summary}</p>
          </div>
        )}

        {memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {memory.people.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400">People</h3>
            <div className="flex flex-wrap gap-2">
              {memory.people.map((person) => (
                <a
                  key={person.family_member_id}
                  href={`/person/${person.family_member_id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-600 overflow-hidden flex items-center justify-center">
                    {person.photo_path ? (
                      <img src={person.photo_path} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-slate-300">{person.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-300">{person.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
    </div>
  );
}
