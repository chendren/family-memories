import { useRef, useState } from 'react';
import { Camera, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  className?: string;
}

export function PhotoCapture({ onCapture, className }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onCapture(file);
    e.target.value = '';
  }

  function clearPreview() {
    setPreview(null);
  }

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      {preview ? (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={clearPreview}
            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-600 hover:border-amber-500/50 text-slate-400 hover:text-amber-500 flex flex-col items-center justify-center gap-1 transition-colors"
        >
          <Camera size={24} />
          <span className="text-[10px] font-medium">Photo</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
