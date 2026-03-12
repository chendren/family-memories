import { useNavigate } from 'react-router-dom';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { PhotoCapture } from '@/components/capture/PhotoCapture';
import { AudioCapture } from '@/components/capture/AudioCapture';
import { DropZone } from '@/components/capture/DropZone';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCaptureStore } from '@/stores/capture-store';

export function CapturePage() {
  const navigate = useNavigate();
  const { pendingFiles, selectedPersonIds, selectedTags, addFile, removeFile } = useCaptureStore();

  function handleDrop(files: File[]) {
    files.forEach(addFile);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <PageHeader
        title="Capture"
        subtitle="Save a moment before it fades"
        action={
          <button
            onClick={() => navigate('/timeline')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            View Timeline
          </button>
        }
      />

      <QuickCapture onSent={() => navigate('/timeline')} />

      <div className="flex items-center gap-4 py-2">
        <PhotoCapture onCapture={addFile} />
        <AudioCapture onCapture={addFile} />
      </div>

      <DropZone files={pendingFiles} onDrop={handleDrop} onRemove={removeFile} />

      {(selectedPersonIds.length > 0 || selectedTags.length > 0) && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          {selectedPersonIds.length > 0 && (
            <div>
              <span className="text-xs text-slate-400 font-medium">People tagged:</span>
              <span className="text-xs text-slate-300 ml-2">{selectedPersonIds.length} selected</span>
            </div>
          )}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
