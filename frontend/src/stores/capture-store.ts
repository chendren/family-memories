import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CaptureState {
  draftText: string;
  pendingFiles: File[];
  selectedPersonIds: string[];
  selectedTags: string[];
  setDraftText: (text: string) => void;
  addFile: (file: File) => void;
  removeFile: (index: number) => void;
  togglePerson: (id: string) => void;
  toggleTag: (tag: string) => void;
  reset: () => void;
}

export const useCaptureStore = create<CaptureState>()(
  persist(
    (set) => ({
      draftText: '',
      pendingFiles: [],
      selectedPersonIds: [],
      selectedTags: [],
      setDraftText: (text) => set({ draftText: text }),
      addFile: (file) => set((state) => ({ pendingFiles: [...state.pendingFiles, file] })),
      removeFile: (index) =>
        set((state) => ({
          pendingFiles: state.pendingFiles.filter((_, i) => i !== index),
        })),
      togglePerson: (id) =>
        set((state) => ({
          selectedPersonIds: state.selectedPersonIds.includes(id)
            ? state.selectedPersonIds.filter((p) => p !== id)
            : [...state.selectedPersonIds, id],
        })),
      toggleTag: (tag) =>
        set((state) => ({
          selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag],
        })),
      reset: () => set({ draftText: '', pendingFiles: [], selectedPersonIds: [], selectedTags: [] }),
    }),
    {
      name: 'capture-draft',
      partialize: (state) => ({
        draftText: state.draftText,
        selectedPersonIds: state.selectedPersonIds,
        selectedTags: state.selectedTags,
      }),
    }
  )
);
