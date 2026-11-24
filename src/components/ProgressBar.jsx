import { motion } from 'framer-motion';

export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 text-xs font-medium text-zinc-400">
        <span>تقدم الجلسة • Session Progress</span>
        <span>
          السؤال {current} من {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-2.5 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />
      </div>
    </div>
  );
}
