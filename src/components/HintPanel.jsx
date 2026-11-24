import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Eye,
  SkipForward,
  Globe,
  CheckSquare,
  LayoutGrid,
  ChevronDown,
  Wrench,
} from 'lucide-react';

// Learning Assistant Panel (collapsed & helpers disabled by default on entry):
// 1. Direct action buttons: Reveal Next Letter (+1 حرف), Show Full Word (إظهار الكلمة), Skip Question (تخطي السؤال)
// 2. Learning mode toggles: Live Letter Boxes, Scrambled Letter Bank, Pre-Answer Arabic Translation
export default function HintPanel({
  onRevealLetter,
  onToggleRevealWord,
  wordRevealed,
  onSkip,
  showTranslation,
  onToggleTranslation,
  showLiveBoxes,
  onToggleLiveBoxes,
  showLetterBank,
  onToggleLetterBank,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const activeCount = (showLiveBoxes ? 1 : 0) + (showLetterBank ? 1 : 0) + (wordRevealed ? 1 : 0);

  return (
    <div className="w-full max-w-xl mx-auto" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-sm font-bold text-zinc-300 hover:bg-white/[0.08] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-300" />
          <span>قسم المساعدات وخيارات التعلم</span>
          {activeCount > 0 ? (
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-xs text-amber-200">
              {activeCount} مفعّل
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-normal text-zinc-400">
              غير مفعّل
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 glass-card p-3.5 sm:p-4 space-y-3">
              {/* Toggleable Learning Preferences */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onToggleLiveBoxes}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    showLiveBoxes
                      ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>تصحيح الحروف الفوري: {showLiveBoxes ? 'مفعّل' : 'غير مفعّل'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleLetterBank}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    showLetterBank
                      ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-200'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>الحروف المبعثرة: {showLetterBank ? 'مفعّلة' : 'غير مفعّلة'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleTranslation}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    showTranslation
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>الترجمة قبل الإجابة: {showTranslation ? 'ظاهرة' : 'مخفية'}</span>
                </button>
              </div>

              {/* Quick Help Actions for the current word */}
              <div className="pt-2.5 border-t border-white/10 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={onRevealLetter}
                  disabled={disabled}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-xs sm:text-sm font-bold text-emerald-200 hover:bg-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>اكشف حرفاً (+1)</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleRevealWord}
                  disabled={disabled}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    wordRevealed
                      ? 'bg-amber-500/25 border-amber-300/60 text-amber-100'
                      : 'bg-amber-500/15 border-amber-400/30 text-amber-200 hover:bg-amber-500/25'
                  }`}
                >
                  <Eye className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{wordRevealed ? 'إخفاء الكلمة' : 'إظهار الكلمة'}</span>
                </button>

                <button
                  type="button"
                  onClick={onSkip}
                  disabled={disabled}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs sm:text-sm font-bold text-zinc-200 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>تخطي السؤال</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
