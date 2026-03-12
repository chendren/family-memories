import { useState, useRef, useCallback, useEffect } from 'react';
import { Microphone, Stop } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface AudioCaptureProps {
  onCapture: (file: File) => void;
  className?: string;
}

export function AudioCapture({ onCapture, className }: AudioCaptureProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        onCapture(file);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      // mic permission denied
    }
  }, [onCapture]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <button
        onMouseDown={!recording ? startRecording : undefined}
        onClick={recording ? stopRecording : undefined}
        className={cn(
          'w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all',
          recording
            ? 'bg-red-500/20 border-2 border-red-500 text-red-400 animate-pulse'
            : 'border-2 border-dashed border-slate-600 hover:border-amber-500/50 text-slate-400 hover:text-amber-500'
        )}
      >
        {recording ? (
          <>
            <Stop size={24} weight="fill" />
            <span className="text-[10px] font-mono">{formatDuration(duration)}</span>
          </>
        ) : (
          <>
            <Microphone size={24} />
            <span className="text-[10px] font-medium">Audio</span>
          </>
        )}
      </button>
    </div>
  );
}
