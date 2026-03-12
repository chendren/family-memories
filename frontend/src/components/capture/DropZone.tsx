import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUp, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  files: File[];
  onDrop: (files: File[]) => void;
  onRemove: (index: number) => void;
  className?: string;
}

export function DropZone({ files, onDrop, onRemove, className }: DropZoneProps) {
  const onDropAccepted = useCallback(
    (accepted: File[]) => onDrop(accepted),
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.webm', '.m4a'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi'],
    },
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-terracotta-400 bg-terracotta-50'
            : 'border-sand-300 hover:border-sand-400 bg-cream-50'
        )}
      >
        <input {...getInputProps()} />
        <CloudArrowUp
          size={40}
          className={cn('mx-auto mb-3', isDragActive ? 'text-terracotta-500' : 'text-sand-400')}
        />
        <p className="text-sm text-walnut-600 font-medium font-body">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-walnut-400 mt-1 font-body">or click to browse (images, audio, video)</p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative group rounded-lg overflow-hidden bg-white border border-sand-200">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square flex flex-col items-center justify-center p-2">
                  <span className="text-xs text-walnut-500 font-medium truncate w-full text-center font-body">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-walnut-400 mt-1 font-body">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              )}
              <button
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
