import { motion } from 'motion/react';
import type { EthnicityRegion } from '@family-memories/shared';

interface Props {
  data: EthnicityRegion[];
}

export function EthnicityChart({ data }: Props) {
  const radius = 70;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg viewBox="0 0 200 200" className="w-52 h-52">
          {data.map((region, i) => {
            const segmentLength = (region.percentage / 100) * circumference;
            const dashArray = `${segmentLength} ${circumference - segmentLength}`;
            const currentOffset = offset;
            offset += segmentLength;

            return (
              <motion.circle
                key={region.region}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={region.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
                transform="rotate(-90 100 100)"
                initial={{ opacity: 0, strokeWidth: 0 }}
                animate={{ opacity: 1, strokeWidth }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
              />
            );
          })}
          {/* Center label */}
          <text x="100" y="95" textAnchor="middle" className="fill-walnut-800 text-2xl font-bold" style={{ fontFamily: 'Playfair Display' }}>
            {data[0]?.percentage ?? 0}%
          </text>
          <text x="100" y="115" textAnchor="middle" className="fill-walnut-400 text-[10px]" style={{ fontFamily: 'Source Sans 3' }}>
            {data[0]?.region ?? ''}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-1 gap-2">
        {data.map((region, i) => (
          <motion.div
            key={region.region}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: region.color }}
            />
            <span className="text-sm text-walnut-600 font-body flex-1 truncate">
              {region.region}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-sand-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: region.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${region.percentage}%` }}
                  transition={{ delay: i * 0.05 + 0.3, duration: 0.4 }}
                />
              </div>
              <span className="text-sm font-semibold text-walnut-800 w-12 text-right font-body">
                {region.percentage}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
