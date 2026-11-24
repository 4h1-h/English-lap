import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Volume2, Globe, Split } from 'lucide-react';

// Simple phonetic breakdown: split the word into readable chunks
function phoneticBreakdown(word) {
  const letters = word.toLowerCase().split('');
  const n = letters.length;
  if (n <= 4) return [word.toLowerCase()];
  const chunkCount = Math.min(3, Math.max(2, Math.round(n / 3)));
  const base = Math.floor(n / chunkCount);
  const extra = n % chunkCount;
  const chunks = [];
  let i = 0;
  for (let c = 0; c < chunkCount; c++) {
    const size = base + (c < extra ? 1 : 0);
    chunks.push(letters.slice(i, i + size).join(''));
    i += size;
  }
  return chunks;
}

// Shown after a correct answer:
// - full Arabic translation of the sentence (dir="rtl")
// - isolated Arabic definition of the target word
// - phonetic breakdown
// - Continue / Next Question button (Enter or click)
export default function SuccessModal({ item, onNext, onReplayWord }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext]);

  const chunks = phoneticBreakdown(item.word);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="glass-card w-full max-w-lg p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-400/15 border border-emerald-300/30">
            <CheckCircle2 className="w-6 h-6 text-emerald-300" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-emerald-300">
              إجابة صحيحة! +10 نقاط • Correct!
            </h2>
            <p className="text-sm text-zinc-400">
              أحسنت — الكلمة <span className="font-semibold text-zinc-200">{item.word}</span> في مكانها الصحيح.
            </p>
          </div>
        </div>

        {/* Arabic translation of the sentence (RTL) */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
          <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5" dir="rtl">
            <Globe className="w-3.5 h-3.5 text-emerald-300" />
            <span>الجملة والترجمة العربية:</span>
          </p>
          <p className="text-left text-base font-medium text-emerald-200 mb-2">
            {item.sentence}
          </p>
          <p dir="rtl" className="text-right text-lg leading-relaxed text-zinc-100">
            {item.ar}
          </p>
        </div>

        {/* Target word meaning + phonetic breakdown */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
            <p className="text-xs font-semibold text-zinc-400 mb-2" dir="rtl">
              معنى الكلمة &ldquo;{item.word}&rdquo;:
            </p>
            <p dir="rtl" className="text-right text-lg font-semibold text-cyan-300">
              {item.arWord}
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
            <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-emerald-300" />
              <span>تقسيم المقاطع • Chunks</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {chunks.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-lg bg-emerald-400/10 border border-emerald-300/25 text-sm font-mono font-semibold text-emerald-200"
                >
                  {c}
                </span>
              ))}
              <button
                onClick={onReplayWord}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                aria-label="Replay word slowly"
                title="سماع الكلمة ببطء"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 text-base font-extrabold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_30px_rgba(52,211,153,0.35)]"
        >
          <span>السؤال التالي • Next Question</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-xs text-zinc-500">أو اضغط مفتاح Enter للمتابعة</p>
      </motion.div>
    </motion.div>
  );
}
