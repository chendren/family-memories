import { useNavigate } from 'react-router-dom';
import { Camera, UsersThree, Images, ArrowRight, Tag, HardDrives } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { MemoryCard } from '@/components/memory/MemoryCard';
import { OnThisDay } from '@/components/dashboard/OnThisDay';
import { useMemories, useStats } from '@/hooks/useMemories';
import { useMembers } from '@/hooks/useFamilyMembers';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: memoriesResponse, isLoading: loadingMemories } = useMemories({ limit: 10, sort: '-created_at' });
  const { data: membersResponse } = useMembers();
  const { data: statsResponse } = useStats();

  const memories = memoriesResponse?.data ?? [];
  const totalMemories = memoriesResponse?.meta?.total ?? 0;
  const totalMembers = membersResponse?.data?.length ?? 0;
  const appStats = statsResponse?.data;

  const stats = [
    { label: 'Memories', value: totalMemories, icon: Images, color: 'text-terracotta-500 bg-terracotta-50' },
    { label: 'Family', value: totalMembers, icon: UsersThree, color: 'text-sage-400 bg-sage-50' },
    { label: 'Media', value: appStats?.media_assets ?? 0, icon: Camera, color: 'text-gold-400 bg-gold-50' },
    { label: 'Tags', value: appStats?.tags ?? 0, icon: Tag, color: 'text-walnut-500 bg-cream-200' },
    { label: 'Storage', value: appStats?.media_size ?? '0 KB', icon: HardDrives, color: 'text-sage-500 bg-sage-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold font-display text-walnut-900">
          Family <span className="text-terracotta-500 italic">Memories</span>
        </h1>
        <p className="text-walnut-500 mt-3 text-lg font-body">Capture, preserve, and rediscover your family's story</p>
      </motion.div>

      {/* Quick Capture */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <QuickCapture />
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 md:grid-cols-5 gap-3"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="bg-white rounded-xl border border-sand-200 p-3 md:p-4 flex flex-col items-center text-center shadow-card"
          >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-1.5', stat.color)}>
              <stat.icon size={18} weight="fill" />
            </div>
            <span className="text-xl font-bold text-walnut-900 font-display">{stat.value}</span>
            <span className="text-[10px] text-walnut-500 mt-0.5 font-body">{stat.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* On This Day + Recent grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* On This Day — sidebar widget */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-1"
        >
          <OnThisDay />
        </motion.div>

        {/* Recent Memories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="md:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-walnut-900 font-display">Recent Memories</h2>
            <button
              onClick={() => navigate('/timeline')}
              className="flex items-center gap-1 text-sm text-terracotta-500 hover:text-terracotta-600 transition-colors font-body font-medium"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          {loadingMemories ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 bg-cream-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : memories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {memories.slice(0, 6).map((memory, i) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                >
                  <MemoryCard memory={memory} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-sand-200 p-8 text-center shadow-card">
              <p className="text-walnut-500 font-body">No memories yet. Capture your first one above!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
