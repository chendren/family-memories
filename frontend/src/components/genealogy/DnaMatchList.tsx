import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserCircle } from '@phosphor-icons/react';
import type { DnaMatch } from '@family-memories/shared';

interface Props {
  matches: DnaMatch[];
}

const MAX_CM = 3720;

function getCmColor(cm: number): string {
  if (cm > 2000) return '#C45A3C';
  if (cm > 800) return '#E07A5F';
  if (cm > 200) return '#DDA15E';
  if (cm > 50) return '#81B29A';
  return '#95A5A6';
}

export function DnaMatchList({ matches }: Props) {
  const navigate = useNavigate();

  if (matches.length === 0) {
    return (
      <p className="text-sm text-walnut-400 font-body py-8 text-center">
        No DNA matches found for this member
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {matches.slice(0, 25).map((match, i) => {
        const barWidth = Math.max(5, (match.shared_centimorgans / MAX_CM) * 100);
        const color = getCmColor(match.shared_centimorgans);

        return (
          <motion.button
            key={match.matched_member_id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/person/${match.matched_member_id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-cream-100 border border-sand-200 hover:border-terracotta-200 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-cream-200 border border-sand-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {match.photo_path ? (
                <img src={`/${match.photo_path}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={24} className="text-sand-300" weight="duotone" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-walnut-800 truncate font-body">
                  {match.matched_member_name}
                </span>
                <span className="text-sm font-bold ml-2 flex-shrink-0 font-body" style={{ color }}>
                  {match.shared_centimorgans.toLocaleString()} cM
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-walnut-400 font-body">
                  {match.predicted_relationship}
                </span>
                <span className="text-xs text-walnut-300 font-body">
                  &middot; {match.shared_segments} segments
                </span>
              </div>
              <div className="w-full h-1.5 bg-sand-100 rounded-full mt-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: i * 0.03 + 0.2, duration: 0.4 }}
                />
              </div>
            </div>
          </motion.button>
        );
      })}
      {matches.length > 25 && (
        <p className="text-xs text-walnut-400 text-center py-2 font-body">
          + {matches.length - 25} more distant matches
        </p>
      )}
    </div>
  );
}
