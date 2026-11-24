import { Volume2, Turtle, SpellCheck } from 'lucide-react';

// Sentence replay + isolated slow target-word replay + letter-by-letter audio spelling
export default function AudioControls({
  onReplaySentence,
  onReplayWord,
  onSpellLetters,
  disabled,
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
      <button
        type="button"
        onClick={onReplaySentence}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs sm:text-sm font-semibold text-zinc-100 hover:bg-white/10 hover:border-emerald-300/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Volume2 className="w-4 h-4 text-emerald-300" />
        <span>سماع الجملة • Sentence 🔊</span>
      </button>
      <button
        type="button"
        onClick={onReplayWord}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs sm:text-sm font-semibold text-zinc-100 hover:bg-white/10 hover:border-cyan-300/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Turtle className="w-4 h-4 text-cyan-300" />
        <span>نطق الكلمة ببطء • Slow Word 🔉</span>
      </button>
      <button
        type="button"
        onClick={onSpellLetters}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs sm:text-sm font-semibold text-zinc-100 hover:bg-white/10 hover:border-amber-300/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <SpellCheck className="w-4 h-4 text-amber-300" />
        <span>تهجئة الحروف صوتياً • Spell Letters 🔤</span>
      </button>
    </div>
  );
}
