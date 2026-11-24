import { motion } from 'framer-motion';
import { Quote, Globe, BookOpen, Eye } from 'lucide-react';

// Elegant typographic card showing the sentence with a glowing blank slot,
// plus pre-answer Arabic translation of the sentence and the missing word.
export default function SentenceCard({
  item,
  solved,
  showTranslation = true,
  wordRevealed = false,
}) {
  const parts = item.blank.split('______');

  return (
    <div className="glass-card relative overflow-hidden px-5 sm:px-10 py-8 sm:py-10 text-center space-y-6">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.07] via-transparent to-cyan-500/[0.07] pointer-events-none" />
      <Quote className="w-6 h-6 text-emerald-400/50 mx-auto" />

      {/* English Sentence with Blank */}
      <p className="relative text-xl sm:text-2xl md:text-3xl leading-relaxed font-medium text-zinc-100">
        {parts[0]}
        <span className="inline-block align-baseline mx-1">
          {solved ? (
            <motion.span
              initial={{ opacity: 0, y: 14, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="inline-block px-3 py-0.5 rounded-xl bg-emerald-400/15 border border-emerald-300/40 text-emerald-300 font-extrabold shadow-[0_0_24px_rgba(52,211,153,0.35)]"
            >
              {item.word}
            </motion.span>
          ) : wordRevealed ? (
            <span className="inline-block px-3 py-0.5 rounded-xl border-2 border-amber-300/60 bg-amber-400/15 text-amber-200 font-mono font-bold tracking-wider">
              {item.word}
            </span>
          ) : (
            <span className="inline-block min-w-[3.5rem] px-3 py-0.5 rounded-xl border-2 border-dashed border-emerald-300/60 bg-emerald-400/5 text-emerald-200/70 animate-glow-pulse font-mono tracking-widest">
              {'?'.repeat(Math.max(4, item.word.length))}
            </span>
          )}
        </span>
        {parts[1]}
      </p>

      {/* Pre-Answer Arabic Translation Section */}
      {showTranslation && (
        <div
          dir="rtl"
          className="relative max-w-2xl mx-auto rounded-2xl bg-white/[0.04] border border-white/10 px-4 sm:px-6 py-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <Globe className="w-3.5 h-3.5" />
              ترجمة الجملة بالعربية:
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-xs sm:text-sm font-bold text-cyan-200">
                <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
                الكلمة المطلوبة: <span className="text-white underline decoration-cyan-400/60">{item.arWord}</span>
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400">
                {item.word.length} حروف
              </span>
            </div>
          </div>

          <p className="text-base sm:text-xl font-medium text-zinc-100 leading-relaxed text-right">
            {item.ar}
          </p>
        </div>
      )}

      {/* Shown when learner clicks "Reveal Word" to practice typing it */}
      {wordRevealed && !solved && (
        <div
          dir="rtl"
          className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-sm font-semibold"
        >
          <Eye className="w-4 h-4 text-amber-300" />
          <span>
            الكلمة الإنجليزية هي:{' '}
            <strong dir="ltr" className="font-mono text-base text-white tracking-widest mx-1">
              {item.word}
            </strong>{' '}
            — اكتبها في الحقل بالأسفل لتثبيت حفظها!
          </span>
        </div>
      )}
    </div>
  );
}
