import { useNavigate } from 'react-router-dom';
import { Camera, UsersThree, Images, ArrowRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { useMemories } from '@/hooks/useMemories';
import { useMembers } from '@/hooks/useFamilyMembers';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: memoriesResponse, isLoading: loadingMemories } = useMemories({ limit: 10, sort: '-created_at' });
  const { data: membersResponse } = useMembers();

  const memories = memoriesResponse?.data ?? [];
  const totalMemories = memoriesResponse?.meta?.total ?? 0;
  const totalMembers = membersResponse?.data?.length ?? 0;

  const stats = [
    { label: 'Memories', value: totalMemories, icon: Images, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Family Members', value: totalMembers, icon: UsersThree, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Media Files', value: '—', icon: Camera, color: 'text-pink-400 bg-pink-500/10' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-slate-100">
          Family <span className="text-amber-500">Memories</span>
        </h1>
        <p className="text-slate-400 mt-3 text-lg">Capture, preserve, and rediscover your family's story</p>
      </motion.div>

      {/* Quick Capture */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <QuickCapture />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col items-center text-center"
          >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', stat.color)}>
              <stat.icon size={20} weight="fill" />
            </div>
            <span className="text-2xl font-bold text-slate-100">{stat.value}</span>
            <span className="text-xs text-slate-500 mt-0.5">{stat.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Recent Memories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Recent Memories</h2>
          <button
            onClick={() => navigate('/timeline')}
            className="flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        {loadingMemories ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 h-64 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : memories.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {memories.map((memory) => (
              <div key={memory.id} className="flex-shrink-0 w-64 snap-start">
                <MemoryCard memory={memory} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <p className="text-slate-400">No memories yet. Capture your first one above!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
