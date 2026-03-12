import { NavLink } from 'react-router-dom';
import { House, PaperPlaneTilt, Clock, MagnifyingGlass, UsersThree, TreeStructure, Dna } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: House, label: 'Home' },
  { to: '/capture', icon: PaperPlaneTilt, label: 'Capture' },
  { to: '/timeline', icon: Clock, label: 'Timeline' },
  { to: '/search', icon: MagnifyingGlass, label: 'Search' },
  { to: '/family', icon: TreeStructure, label: 'Tree' },
  { to: '/family/members', icon: UsersThree, label: 'Family' },
  { to: '/genealogy', icon: Dna, label: 'DNA' },
];

export function NavBar() {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-60 bg-white/80 backdrop-blur-sm border-r border-sand-200 h-screen fixed left-0 top-0 z-40">
        <div className="px-6 py-6 border-b border-sand-200">
          <h1 className="text-xl font-bold text-terracotta-600 font-display">Family Memories</h1>
        </div>
        <div className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium font-body transition-colors',
                  isActive
                    ? 'bg-terracotta-50 text-terracotta-600'
                    : 'text-walnut-500 hover:text-walnut-700 hover:bg-cream-200'
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-sand-200 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium font-body transition-colors',
                  isActive ? 'text-terracotta-600' : 'text-walnut-400'
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
