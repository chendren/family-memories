import { NavLink } from 'react-router-dom';
import { House, PaperPlaneTilt, Clock, MagnifyingGlass, UsersThree, TreeStructure } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: House, label: 'Home' },
  { to: '/capture', icon: PaperPlaneTilt, label: 'Capture' },
  { to: '/timeline', icon: Clock, label: 'Timeline' },
  { to: '/search', icon: MagnifyingGlass, label: 'Search' },
  { to: '/family', icon: TreeStructure, label: 'Tree' },
  { to: '/family/members', icon: UsersThree, label: 'Family' },
];

export function NavBar() {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-60 bg-slate-800/90 backdrop-blur-sm border-r border-slate-700 h-screen fixed left-0 top-0 z-40">
        <div className="px-6 py-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-amber-500">Family Memories</h1>
        </div>
        <div className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                )
              }
            >
              <item.icon size={20} weight="fill" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive ? 'text-amber-500' : 'text-slate-400'
                )
              }
            >
              <item.icon size={22} weight="fill" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
