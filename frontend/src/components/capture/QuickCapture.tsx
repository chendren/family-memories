import { useRef } from 'react';
import { PaperPlaneTilt, Camera, Microphone, Paperclip, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useCaptureStore } from '@/stores/capture-store';
import { useQuickCapture } from '@/hooks/useMemories';
import { useMembers } from '@/hooks/useFamilyMembers';
import { cn } from '@/lib/utils';

interface QuickCaptureProps {
  className?: string;
  onSent?: () => void;
}

export function QuickCapture({ className, onSent }: QuickCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const {
    draftText,
    pendingFiles,
    selectedPersonIds,
    selectedTags,
    setDraftText,
    addFile,
    removeFile,
    togglePerson,
    reset,
  } = useCaptureStore();
  const quickCapture = useQuickCapture();
  const { data: membersResponse } = useMembers();
  const members = membersResponse?.data ?? [];

  async function handleSend() {
    if (!draftText.trim() && pendingFiles.length === 0) return;

    const formData = new FormData();
    if (draftText.trim()) formData.append('text', draftText.trim());
    pendingFiles.forEach((file) => formData.append('files', file));
    if (selectedPersonIds.length > 0) formData.append('person_ids', JSON.stringify(selectedPersonIds));
    if (selectedTags.length > 0) formData.append('tags', JSON.stringify(selectedTags));

    await quickCapture.mutateAsync(formData);
    reset();
    onSent?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(addFile);
    e.target.value = '';
  }

  const hasContent = draftText.trim() || pendingFiles.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* File previews */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex gap-2 overflow-x-auto pb-2"
          >
            {pendingFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-cream-200 border border-sand-200">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-walnut-500">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Person selector */}
      {members.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => togglePerson(member.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-body transition-colors border',
                selectedPersonIds.includes(member.id)
                  ? 'bg-terracotta-50 text-terracotta-600 border-terracotta-200'
                  : 'bg-white text-walnut-500 border-sand-200 hover:border-sand-300'
              )}
            >
              {member.photo_path ? (
                <img src={member.photo_path} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-cream-300 flex items-center justify-center text-[8px] text-walnut-600">
                  {member.name.charAt(0)}
                </div>
              )}
              {member.nickname ?? member.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-white rounded-2xl border border-sand-200 focus-within:border-terracotta-300 focus-within:shadow-warm transition-all shadow-card">
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What happened today?"
            rows={1}
            className="w-full bg-transparent px-4 py-3 text-sm text-walnut-800 placeholder:text-walnut-400 resize-none focus:outline-none max-h-32 font-body"
            style={{ minHeight: '44px' }}
          />
          <div className="flex items-center gap-1 px-2 pb-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 rounded-full text-walnut-400 hover:text-terracotta-500 hover:bg-terracotta-50 transition-colors"
            >
              <Camera size={18} />
            </button>
            <button className="p-2 rounded-full text-walnut-400 hover:text-terracotta-500 hover:bg-terracotta-50 transition-colors">
              <Microphone size={18} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-walnut-400 hover:text-terracotta-500 hover:bg-terracotta-50 transition-colors"
            >
              <Paperclip size={18} />
            </button>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={!hasContent || quickCapture.isPending}
          className={cn(
            'p-3 rounded-full transition-all flex-shrink-0',
            hasContent
              ? 'bg-terracotta-500 text-white hover:bg-terracotta-600 shadow-warm'
              : 'bg-cream-200 text-walnut-400'
          )}
        >
          <PaperPlaneTilt size={20} weight="fill" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*,.pdf,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
