import { motion } from 'framer-motion';
import { Headphones, Sparkles, Keyboard, Globe } from 'lucide-react';

// Initial interactive overlay — satisfies browser audio autoplay policy
export default function StartOverlay({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}
        className="glass-card w-full max-w-lg p-8 sm:p-10 text-center space-y-6"
      >
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400/25 to-cyan-400/25 border border-emerald-300/30 flex items-center justify-center">
          <Headphones className="w-8 h-8 text-emerald-300" />
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
            English Spelling Pro
          </h1>
          <p dir="rtl" className="mt-2 text-zinc-200 text-base font-semibold">
            استمع إلى الجملة، شاهد الترجمة العربية، وتدرّب على إملاء الكلمة المفقودة بسهولة!
          </p>
          <p className="mt-1 text-zinc-400 text-xs sm:text-sm">
            Listen to the sentence, view the Arabic translation, and spell the missing word.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center" dir="rtl">
          {[
            { icon: Sparkles, label: '200 كلمة وجملة' },
            { icon: Globe, label: 'ترجمة عربية فورية' },
            { icon: Keyboard, label: 'تصحيح وحروف مساعدة' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-2xl bg-white/[0.04] border border-white/10 py-3 px-2"
            >
              <Icon className="w-5 h-5 text-teal-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-zinc-300">{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 text-lg font-extrabold hover:from-emerald-400 hover:to-teal-400 transition-all shadow-[0_0_40px_rgba(52,211,153,0.4)]"
        >
          ابدأ التدريب الآن • Start Session 🔊
        </button>
      </motion.div>
    </motion.div>
  );
}
