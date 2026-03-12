import { useRef, useState, useEffect } from 'react';
import { Play, Pause } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface MediaPlayerProps {
  src: string;
  type: 'audio' | 'video';
  className?: string;
}

export function MediaPlayer({ src, type, className }: MediaPlayerProps) {
  const ref = useRef<HTMLAudioElement | HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => setDuration(el.duration);
    const onEnded = () => setPlaying(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('ended', onEnded);
    };
  }, []);

  function togglePlay() {
    const el = ref.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * duration;
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('rounded-xl bg-white border border-sand-200 overflow-hidden', className)}>
      {type === 'video' && (
        <video ref={ref as React.RefObject<HTMLVideoElement>} src={src} className="w-full" />
      )}
      {type === 'audio' && <audio ref={ref as React.RefObject<HTMLAudioElement>} src={src} />}

      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-terracotta-500 text-white flex items-center justify-center hover:bg-terracotta-600 transition-colors flex-shrink-0"
        >
          {playing ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
        </button>

        <div className="flex-1 cursor-pointer" onClick={seek}>
          <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="text-xs text-walnut-400 font-mono tabular-nums flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
