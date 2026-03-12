import { create } from 'zustand';

interface AppState {
  selectedPersonId: string | null;
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  toggleSidebar: () => void;
  selectPerson: (id: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedPersonId: null,
  sidebarOpen: false,
  theme: 'dark',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  selectPerson: (id) => set({ selectedPersonId: id }),
  setTheme: (theme) => set({ theme }),
}));
