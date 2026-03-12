import { useNavigate } from 'react-router-dom';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { PhotoCapture } from '@/components/capture/PhotoCapture';
import { AudioCapture } from '@/components/capture/AudioCapture';
import { DropZone } from '@/components/capture/DropZone';
import { StoryPrompts } from '@/components/capture/StoryPrompts';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCaptureStore } from '@/stores/capture-store';

export function CapturePage() {
  const navigate = useNavigate();
  const { pendingFiles, selectedPersonIds, selectedTags, addFile, removeFile, setDraftText, draftText } = useCaptureStore();

  function handleDrop(files: File[]) {
    files.forEach(addFile);
  }

  function handlePromptSelect(prompt: string) {
    const prefix = draftText ? draftText + '\n\n' : '';
    setDraftText(prefix + prompt + '\n\n');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 space-y-6">
      <PageHeader
        title="Capture"
        subtitle="Save a moment before it fades"
        action={
          <button
            onClick={() => navigate('/timeline')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm text-walnut-600 hover:bg-cream-200 transition-colors border border-sand-200 font-body"
          >
            View Timeline
          </button>
        }
      />

      {/* Story Prompts — inspired by StoryWorth */}
      <StoryPrompts onSelect={handlePromptSelect} />

      <QuickCapture onSent={() => navigate('/timeline')} />

      <div className="flex items-center gap-4 py-2">
        <PhotoCapture onCapture={addFile} />
        <AudioCapture onCapture={addFile} />
      </div>

      <DropZone files={pendingFiles} onDrop={handleDrop} onRemove={removeFile} />

      {(selectedPersonIds.length > 0 || selectedTags.length > 0) && (
        <div className="bg-white border border-sand-200 rounded-xl p-4 space-y-3 shadow-card">
          {selectedPersonIds.length > 0 && (
            <div>
              <span className="text-xs text-walnut-500 font-medium font-body">People tagged:</span>
              <span className="text-xs text-walnut-700 ml-2 font-body">{selectedPersonIds.length} selected</span>
            </div>
          )}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-terracotta-50 text-terracotta-600 border border-terracotta-200 font-body"
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
