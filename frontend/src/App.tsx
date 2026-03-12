import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Shell } from '@/components/layout/Shell';
import { DashboardPage } from '@/pages/DashboardPage';
import { CapturePage } from '@/pages/CapturePage';
import { TimelinePage } from '@/pages/TimelinePage';
import { SearchPage } from '@/pages/SearchPage';
import { FamilyTreePage } from '@/pages/FamilyTreePage';
import { FamilyMembersPage } from '@/pages/FamilyMembersPage';
import { MemoryDetailPage } from '@/pages/MemoryDetailPage';
import { PersonPage } from '@/pages/PersonPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/capture" element={<CapturePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/family" element={<FamilyTreePage />} />
            <Route path="/family/members" element={<FamilyMembersPage />} />
            <Route path="/memories/:id" element={<MemoryDetailPage />} />
            <Route path="/person/:id" element={<PersonPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="light"
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            border: '1px solid #E8DDD3',
            color: '#433832',
          },
        }}
      />
    </QueryClientProvider>
  );
}
