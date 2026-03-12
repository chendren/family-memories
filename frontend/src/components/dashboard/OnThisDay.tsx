import { useNavigate } from 'react-router-dom';
import { CalendarBlank, Clock } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { useOnThisDay } from '@/hooks/useMemories';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function OnThisDay() {
  const navigate = useNavigate();
  const { data, isLoading } = useOnThisDay();

  const memories = data?.data ?? [];
  const month = data?.meta?.month;
  const day = data?.meta?.day;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gold-50 to-cream-100 rounded-xl border border-gold-200 p-5 animate-pulse">
        <div className="h-5 w-40 bg-gold-100 rounded mb-3" />
        <div className="h-16 bg-gold-100 rounded" />
      </div>
    );
  }

  if (memories.length === 0) return null;

  const dateLabel = month && day ? `${MONTH_NAMES[month - 1]} ${day}` : 'Today';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 }}
      className="bg-gradient-to-br from-gold-50 via-cream-50 to-terracotta-50 rounded-xl border border-gold-200 p-5 shadow-warm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center">
          <CalendarBlank size={18} weight="fill" className="text-gold-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-walnut-800 font-display">On This Day</h3>
          <p className="text-[11px] text-walnut-400 font-body">{dateLabel} in years past</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {memories.slice(0, 5).map((memory, i) => {
          const year = memory.memory_date ? new Date(memory.memory_date).getFullYear() : null;
          const yearsAgo = year ? new Date().getFullYear() - year : null;

          return (
            <motion.button
              key={memory.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              onClick={() => navigate(`/memories/${memory.id}`)}
              className="w-full flex items-start gap-3 p-2.5 rounded-lg bg-white/60 hover:bg-white border border-gold-100 hover:border-gold-200 transition-all text-left group"
            >
              {(memory as any).thumbnail_path ? (
                <img
                  src={(memory as any).thumbnail_path}
                  alt=""
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-sand-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-cream-200 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-walnut-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-walnut-800 truncate group-hover:text-terracotta-600 transition-colors font-body">
                  {memory.title}
                </p>
                <p className="text-[11px] text-gold-500 font-medium font-body">
                  {yearsAgo === 1 ? '1 year ago' : yearsAgo ? `${yearsAgo} years ago` : ''}
                  {year ? ` · ${year}` : ''}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {memories.length > 5 && (
        <p className="text-[11px] text-walnut-400 mt-3 text-center font-body">
          + {memories.length - 5} more memories from this day
        </p>
      )}
    </motion.div>
  );
}
