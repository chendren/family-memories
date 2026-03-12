import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

export function Shell() {
  return (
    <div className="min-h-screen bg-cream-100">
      <NavBar />
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
