import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { useProcessingToasts } from '@/hooks/useProcessingToasts';

export function Shell() {
  useProcessingToasts();

  return (
    <div className="min-h-screen bg-cream-100">
      <NavBar />
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
